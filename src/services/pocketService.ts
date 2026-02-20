import {
  collection,
  doc,
  DocumentData,
  DocumentSnapshot,
  limit as firestoreLimit,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  runTransaction,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, getSubscriptionHealthState, handleFirebaseInternalError, resetRecoveryTracking } from '@/lib/firebase';
import { APP_LIMITS, RATE_LIMITS, SUBSCRIPTION_CONFIG } from '@/constants/config';
import { Pocket, Transaction, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { generateSecureRandomString } from '@/lib/secureRandom';
import { enforceRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';
import { writeAuditLog } from '@/lib/audit';

type SubscriptionEntry = {
  cleanup: () => void;
  createdAt: number;
  timerId?: ReturnType<typeof setTimeout>;
  pocketId: string;
  type: 'transactions' | 'pocket';
};

const activeSubscriptions = new Map<string, SubscriptionEntry>();
let subscriptionErrorCount = 0;
let lastSuccessfulOperation = Date.now();

const cleanupSubscription = (id: string, invokeCleanup = true) => {
  const entry = activeSubscriptions.get(id);
  if (!entry) return;

  if (entry.timerId) {
    clearTimeout(entry.timerId);
  }

  if (invokeCleanup) {
    try {
      entry.cleanup();
    } catch (error) {
      logger.warn('Error during subscription cleanup', { error, context: { subscriptionId: id } });
    }
  }

  activeSubscriptions.delete(id);
};

const registerSubscription = (id: string, pocketId: string, type: SubscriptionEntry['type'], cleanup: () => void) => {
  const timerId = setTimeout(() => {
    logger.info('Subscription exceeded max age, cleaning up', { context: { id, pocketId, type } });
    cleanupSubscription(id);
  }, SUBSCRIPTION_CONFIG.maxAgeMs);

  activeSubscriptions.set(id, { cleanup, createdAt: Date.now(), timerId, pocketId, type });
};

const cleanupExistingByPrefix = (prefix: string) => {
  const existingKey = Array.from(activeSubscriptions.keys()).find(key => key.startsWith(prefix));
  if (existingKey) {
    cleanupSubscription(existingKey);
  }
};

type SubscriptionErrorHandler = (error: unknown) => Promise<boolean> | boolean;

interface SubscriptionFactoryOptions<T> {
  type: SubscriptionEntry['type'];
  pocketId: string;
  keyPrefix: string;
  subscribe: (
    onData: (snapshot: unknown) => void,
    onError: (error: unknown) => void
  ) => () => void;
  processSnapshot: (snapshot: unknown) => T;
  onDataErrorFallback: (error: unknown) => T;
  callback: (data: T) => void;
  onFatalError?: SubscriptionErrorHandler;
}

const createSubscription = <T>({
  type,
  pocketId,
  keyPrefix,
  subscribe,
  processSnapshot,
  onDataErrorFallback,
  callback,
  onFatalError,
}: SubscriptionFactoryOptions<T>) => {
  const subscriptionId = `${keyPrefix}_${pocketId}_${Date.now()}`;
  let isActive = true;
  let unsubscribeFunction: (() => void) | null = null;
  let retryCount = 0;
  let consecutiveErrors = 0;
  const { maxRetries, maxConsecutiveErrors } = SUBSCRIPTION_CONFIG;

  cleanupExistingByPrefix(`${keyPrefix}_${pocketId}`);

  const retrySubscription = () => {
    if (!isActive || retryCount >= maxRetries) {
      logger.error(`${type} subscription ${subscriptionId} failed after ${maxRetries} attempts`, { context: { pocketId } });

      if (consecutiveErrors >= maxConsecutiveErrors && isActive) {
        logger.warn('Subscription consistently failing, may need manual recovery', { context: { pocketId, type } });
      }
      return;
    }

    retryCount++;

    if (unsubscribeFunction) {
      try {
        unsubscribeFunction();
      } catch (error) {
        logger.warn('Error during subscription cleanup', { error, context: { subscriptionId } });
      }
      unsubscribeFunction = null;
    }

    const baseDelay =
      consecutiveErrors > 0 && subscriptionErrorCount > 5
        ? SUBSCRIPTION_CONFIG.degradedRetryDelayMs
        : SUBSCRIPTION_CONFIG.baseRetryDelayMs;
    // Exponential backoff with jitter avoids synchronized retries under outage conditions.
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, retryCount - 1),
      SUBSCRIPTION_CONFIG.maxRetryDelayMs
    );
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;

    logger.debug(`Retrying ${type} subscription ${subscriptionId} in ${Math.round(delay)}ms (attempt ${retryCount}/${maxRetries})`, { context: { pocketId } });

    setTimeout(() => {
      if (isActive) {
        setupSubscription();
      }
    }, delay);
  };

  const setupSubscription = () => {
    try {
      unsubscribeFunction = subscribe(
        (snapshot) => {
          if (!isActive) return;

          try {
            const data = processSnapshot(snapshot);
            retryCount = 0;
            consecutiveErrors = 0;
            subscriptionErrorCount = Math.max(0, subscriptionErrorCount - 1);
            lastSuccessfulOperation = Date.now();

            if (getSubscriptionHealthState() === 'recovering') {
              resetRecoveryTracking();
            }

            callback(data);
          } catch (error) {
            logger.error('Error processing subscription data', { error, context: { pocketId, type } });
            consecutiveErrors++;

            if (consecutiveErrors >= maxConsecutiveErrors) {
              logger.warn('Too many consecutive data processing errors, recreating subscription', { context: { pocketId, type } });
              retrySubscription();
            } else {
              callback(onDataErrorFallback(error));
            }
          }
        },
        async (error: unknown) => {
          if (!isActive) return;

          logger.error(`${type} subscription error`, { error, context: { pocketId } });
          consecutiveErrors++;
          subscriptionErrorCount++;

          const errorMessage = error instanceof Error ? error.message : String(error);
          const isInternalAssertion = errorMessage.includes('INTERNAL ASSERTION FAILED');
          const isSubscriptionCorruption = errorMessage.includes('ID: ca9') ||
                                         errorMessage.includes('ID: b815') ||
                                         errorMessage.includes('Fe:-1') ||
                                         errorMessage.includes('Unexpected state');

          if (isInternalAssertion || isSubscriptionCorruption) {
            logger.warn('Detected Firebase internal assertion failure in subscription', { context: { pocketId, type } });

            const recovered = await handleFirebaseInternalError(error);
            if (recovered && isActive) {
              logger.info('Firebase recovery successful, recreating subscription', { context: { pocketId, type } });
              setTimeout(() => {
                if (isActive) {
                  retrySubscription();
                }
              }, SUBSCRIPTION_CONFIG.recoveryRetryDelayMs);
            } else if (isActive) {
              logger.warn('Firebase recovery failed, using exponential backoff', { context: { pocketId, type } });
              retrySubscription();
            }
          } else if (onFatalError) {
            const shouldRetry = await onFatalError(error);
            if (shouldRetry && isActive) {
              retrySubscription();
            }
          } else {
            retrySubscription();
          }
        }
      );

      if (process.env.NODE_ENV === 'development') {
        logger.debug(`${type} subscription ${subscriptionId} established`, { context: { pocketId } });
      }
    } catch (error) {
      logger.error('Error setting up subscription', { error, context: { pocketId, type } });

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('INTERNAL ASSERTION FAILED')) {
        handleFirebaseInternalError(error).then((recovered) => {
          if (recovered && isActive) {
            setTimeout(() => retrySubscription(), SUBSCRIPTION_CONFIG.internalAssertionRetryDelayMs);
          }
        });
      } else {
        retrySubscription();
      }
    }
  };

  const cleanupFunction = () => {
    isActive = false;
    if (unsubscribeFunction) {
      try {
        unsubscribeFunction();
      } catch (error) {
        logger.warn('Error during subscription cleanup', { error, context: { subscriptionId } });
      }
    }
    cleanupSubscription(subscriptionId, false);
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`${type} subscription ${subscriptionId} cleaned up`, { context: { pocketId } });
    }
  };

  registerSubscription(subscriptionId, pocketId, type, cleanupFunction);
  setupSubscription();

  return cleanupFunction;
};

const sanitizePocketServiceError = (
  error: unknown,
  allowedMessages: string[],
  fallbackMessage: string,
  logContext: string,
  context?: Record<string, unknown>
): never => {
  if (error instanceof Error && allowedMessages.includes(error.message)) {
    throw error;
  }

  logger.error(logContext, { error, context });
  throw new Error(fallbackMessage);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isIndexRequiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';

  return code === 'failed-precondition' || message.includes('requires an index');
};

const parsePocketDocument = (snapshot: DocumentSnapshot<DocumentData>, pocketId?: string): Pocket | null => {
  if (!snapshot.exists()) {
    return null;
  }

  const rawData = snapshot.data();
  if (!isRecord(rawData)) {
    logger.warn('Pocket document is not an object', { context: { pocketId } });
    return null;
  }

  const participants = Array.isArray(rawData.participants)
    ? rawData.participants.filter((id): id is string => typeof id === 'string')
    : [];

  const rolesRaw = isRecord(rawData.roles) ? rawData.roles : {};
  const roles = Object.entries(rolesRaw).reduce<Record<string, UserRole>>((acc, [uid, role]) => {
    if (role === 'provider' || role === 'spender') {
      acc[uid] = role;
    }
    return acc;
  }, {});

  const createdAt =
    isRecord(rawData.createdAt) && typeof rawData.createdAt.toDate === 'function'
      ? rawData.createdAt.toDate()
      : new Date();
  const deletedAt =
    isRecord(rawData.deletedAt) && typeof rawData.deletedAt.toDate === 'function'
      ? rawData.deletedAt.toDate()
      : undefined;

  return {
    id: typeof rawData.id === 'string' ? rawData.id : snapshot.id,
    name: typeof rawData.name === 'string' ? rawData.name : 'Untitled Pocket',
    createdAt,
    participants,
    roles,
    balance: typeof rawData.balance === 'number' ? rawData.balance : 0,
    totalFunded: typeof rawData.totalFunded === 'number' ? rawData.totalFunded : 0,
    totalSpent: typeof rawData.totalSpent === 'number' ? rawData.totalSpent : 0,
    inviteCode: typeof rawData.inviteCode === 'string' ? rawData.inviteCode : undefined,
    deleted: Boolean(rawData.deleted),
    deletedAt,
    deletedBy: typeof rawData.deletedBy === 'string' ? rawData.deletedBy : undefined,
  };
};

const parseTransactionSnapshot = (snapshot: QuerySnapshot<DocumentData>): Transaction[] =>
  snapshot.docs
    .filter((docSnap) => docSnap.data()?.deleted !== true)
    .map((docSnap) => {
    const data = docSnap.data();
    const date =
      isRecord(data.date) && typeof data.date.toDate === 'function'
        ? data.date.toDate()
        : new Date();
    const createdAt =
      isRecord(data.createdAt) && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : new Date();

    const txType: Transaction['type'] = data.type === 'fund' ? 'fund' : 'expense';

    return {
      id: docSnap.id,
      pocketId: typeof data.pocketId === 'string' ? data.pocketId : '',
      userId: typeof data.userId === 'string' ? data.userId : '',
      type: txType,
      category: typeof data.category === 'string' ? data.category : '',
      description: typeof data.description === 'string' ? data.description : '',
      amount: typeof data.amount === 'number' ? data.amount : 0,
      date,
      createdAt,
      receiptUrl: typeof data.receiptUrl === 'string' ? data.receiptUrl : undefined,
    };
  })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

/**
 * Creates a new pocket with an invite code and initializes all numeric totals.
 */
export const createPocket = async (
  name: string,
  creatorUid: string,
  creatorRole: UserRole
): Promise<Pocket> => {
  try {
    const pocketId = uuidv4();
    const inviteCode = generateSecureRandomString(6);
    
    const pocket: Pocket = {
      id: pocketId,
      name,
      createdAt: new Date(),
      participants: [creatorUid],
      roles: {
        [creatorUid]: creatorRole,
      },
      balance: 0,
      totalFunded: 0,
      totalSpent: 0,
      inviteCode,
    };

    await setDoc(doc(db, 'pockets', pocketId), pocket);
    return pocket;
  } catch (error) {
    return sanitizePocketServiceError(
      error,
      [],
      'Unable to create pocket right now. Please try again later.',
      'Error creating pocket'
    );
  }
};

/**
 * Joins a pocket using invite code and assigns the selected role.
 */
export const joinPocket = async (inviteCode: string, userUid: string, role: UserRole) => {
  try {
    enforceRateLimit({
      key: `join-pocket:${userUid}`,
      windowMs: RATE_LIMITS.joinPocket.windowMs,
      maxRequests: RATE_LIMITS.joinPocket.maxRequests,
    });

    // Find pocket by invite code
    const pocketsQuery = query(
      collection(db, 'pockets'),
      where('inviteCode', '==', inviteCode)
    );
    const querySnapshot = await getDocs(pocketsQuery);

    if (querySnapshot.empty) {
      throw new Error('Invalid invite code');
    }

    const pocketDoc = querySnapshot.docs[0];
    const pocketData = parsePocketDocument(pocketDoc, pocketDoc.id);
    if (!pocketData) {
      throw new Error('Pocket not found');
    }

    if (pocketData.participants.includes(userUid)) {
      throw new Error('You are already a member of this pocket');
    }

    if (pocketData.participants.length >= 2) {
      throw new Error('This pocket is already full');
    }

    // Update pocket with new participant
    await updateDoc(doc(db, 'pockets', pocketData.id), {
      participants: [...pocketData.participants, userUid],
      [`roles.${userUid}`]: role,
    });
    await writeAuditLog({
      actorUid: userUid,
      action: 'pocket.role.assigned',
      targetId: pocketData.id,
      targetType: 'pocket',
      metadata: { role, source: 'joinPocket' },
    });

    return { ...pocketData, participants: [...pocketData.participants, userUid] };
  } catch (error) {
    return sanitizePocketServiceError(
      error,
      [
        'Invalid invite code',
        'Pocket not found',
        'You are already a member of this pocket',
        'This pocket is already full',
        'Too many requests. Please try again soon.',
      ],
      'Unable to join pocket right now. Please try again later.',
      'Error joining pocket',
      { inviteCode, userUid, role }
    );
  }
};

/**
 * Fetches a pocket by ID and returns null for missing or deleted pockets.
 */
export const getPocket = async (pocketId: string): Promise<Pocket | null> => {
  try {
    const pocketDoc = await getDoc(doc(db, 'pockets', pocketId));
    if (pocketDoc.exists()) {
      const pocket = parsePocketDocument(pocketDoc, pocketId);
      if (!pocket) {
        return null;
      }
      
      // Return null for deleted pockets
      if (pocket.deleted) {
        return null;
      }
      
      return pocket;
    }
    return null;
  } catch (error) {
    logger.error('Error fetching pocket', { error, context: { pocketId } });
    return null;
  }
};

/**
 * Adds a transaction and atomically updates pocket aggregates.
 */
export const addTransaction = async (
  pocketId: string,
  userId: string,
  type: 'fund' | 'expense',
  category: string,
  description: string,
  amount: number
): Promise<Transaction> => {
  try {
    enforceRateLimit({
      key: `add-transaction:${userId}`,
      windowMs: RATE_LIMITS.addTransaction.windowMs,
      maxRequests: RATE_LIMITS.addTransaction.maxRequests,
    });

    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > APP_LIMITS.maxTransactionAmount) {
      throw new Error('Invalid transaction amount');
    }

    if (type !== 'fund' && type !== 'expense') {
      throw new Error('Invalid transaction type');
    }

    const transactionAmount = Math.round(normalizedAmount * 100) / 100;
    const balanceChange = type === 'fund' ? transactionAmount : -transactionAmount;
    const totalField = type === 'fund' ? 'totalFunded' : 'totalSpent';

    const transactionDocRef = doc(collection(db, 'transactions'));
    const timestamp = new Date();

    const transactionPayload: Omit<Transaction, 'id'> = {
      pocketId,
      userId,
      type,
      category,
      description,
      amount: transactionAmount,
      date: timestamp,
      createdAt: timestamp,
    };

    await runTransaction(db, async (firestoreTransaction) => {
      const pocketRef = doc(db, 'pockets', pocketId);
      const pocketSnapshot = await firestoreTransaction.get(pocketRef);

      if (!pocketSnapshot.exists()) {
        throw new Error('Pocket not found');
      }

      const pocketData = parsePocketDocument(pocketSnapshot, pocketId);
      if (!pocketData) {
        throw new Error('Pocket not found');
      }

      if (pocketData.deleted) {
        throw new Error('Pocket not available');
      }

      if (!pocketData.participants || !pocketData.participants.includes(userId)) {
        throw new Error('You are not authorized to add transactions to this pocket');
      }

      firestoreTransaction.set(transactionDocRef, transactionPayload);
      firestoreTransaction.update(pocketRef, {
        balance: increment(balanceChange),
        [totalField]: increment(transactionAmount),
      });
    });

    return { ...transactionPayload, id: transactionDocRef.id };
  } catch (error) {
    return sanitizePocketServiceError(
      error,
      [
        'Invalid transaction amount',
        'Invalid transaction type',
        'Pocket not found',
        'Pocket not available',
        'You are not authorized to add transactions to this pocket',
        'Too many requests. Please try again soon.',
      ],
      'Unable to add this transaction right now. Please try again later.',
      'Error adding transaction',
      { pocketId, userId, type }
    );
  }
};

export interface PaginatedTransactionsResult {
  transactions: Transaction[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Loads a paginated transactions page sorted by most recent date first.
 */
export const fetchTransactionsPage = async (
  pocketId: string,
  pageSize = 20,
  cursor?: QueryDocumentSnapshot
): Promise<PaginatedTransactionsResult> => {
  try {
    const constraints: QueryConstraint[] = [
      where('pocketId', '==', pocketId),
      orderBy('date', 'desc'),
      firestoreLimit(pageSize),
    ];

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    const paginatedQuery = query(
      collection(db, 'transactions'),
      ...constraints
    );

    const snapshot = await getDocs(paginatedQuery);

    const transactions = parseTransactionSnapshot(snapshot);

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      transactions,
      cursor: lastDoc,
      hasMore: snapshot.size === pageSize,
    };
  } catch (error) {
    if (isIndexRequiredError(error)) {
      logger.warn('Missing Firestore index for paginated transactions query. Falling back to non-indexed query.', {
        error,
        context: { pocketId },
      });

      const fallbackSnapshot = await getDocs(query(collection(db, 'transactions'), where('pocketId', '==', pocketId)));
      const fallbackTransactions = parseTransactionSnapshot(fallbackSnapshot);

      return {
        transactions: fallbackTransactions,
        cursor: null,
        hasMore: false,
      };
    }

    return sanitizePocketServiceError(
      error,
      [],
      'Unable to load transactions right now. Please try again later.',
      'Error fetching paginated transactions',
      { pocketId, pageSize, hasCursor: Boolean(cursor) }
    );
  }
};

/**
 * Subscribes to real-time transaction updates for a pocket.
 */
export const subscribeToTransactions = (
  pocketId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('pocketId', '==', pocketId)
  );

  return createSubscription<Transaction[]>({
    type: 'transactions',
    pocketId,
    keyPrefix: 'transactions',
    subscribe: (onData, onError) => onSnapshot(transactionsQuery, onData, onError),
    processSnapshot: (snapshot) => {
      const querySnapshot = snapshot as QuerySnapshot<DocumentData>;
      return parseTransactionSnapshot(querySnapshot);
    },
    onDataErrorFallback: () => [],
    callback,
  });
};

/**
 * Removes the current user from pocket participants and role mapping.
 */
export const leavePocket = async (pocketId: string, userUid: string): Promise<void> => {
  try {
    const pocketRef = doc(db, 'pockets', pocketId);
    const pocketDoc = await getDoc(pocketRef);
    
    if (!pocketDoc.exists()) {
      throw new Error('Pocket not found');
    }
    
    const pocketData = parsePocketDocument(pocketDoc, pocketId);
    if (!pocketData) {
      throw new Error('Pocket not found');
    }
    
    // More robust membership check - allow leaving even if not in participants list
    // This handles cases where the user might be in an inconsistent state
    const isParticipant = pocketData.participants && pocketData.participants.includes(userUid);
    const hasRole = pocketData.roles && pocketData.roles[userUid];
    
    if (!isParticipant && !hasRole) {
      logger.warn('User appears not to be a member, proceeding with cleanup anyway', { context: { pocketId, userUid } });
      // Don't throw error - just proceed with cleanup in case of stale data
    }
    
    // Remove user from participants (if present)
    const updatedParticipants = pocketData.participants 
      ? pocketData.participants.filter(id => id !== userUid)
      : [];
    
    // Remove user's role (if present)
    const updatedRoles = { ...pocketData.roles };
    if (updatedRoles[userUid]) {
      delete updatedRoles[userUid];
    }
    
    // Update the pocket document
    await updateDoc(pocketRef, {
      participants: updatedParticipants,
      roles: updatedRoles,
    });
    await writeAuditLog({
      actorUid: userUid,
      action: 'pocket.leave',
      targetId: pocketId,
      targetType: 'pocket',
    });
    
    logger.debug('Pocket departure completed for current user.', { context: { pocketId, userUid } });
  } catch (error) {
    return sanitizePocketServiceError(
      error,
      ['Pocket not found'],
      'Unable to leave this pocket right now. Please try again later.',
      'Error leaving pocket',
      { pocketId, userUid }
    );
  }
};

/**
 * Soft-deletes a pocket and marks associated transactions as deleted.
 */
export const deletePocket = async (pocketId: string, userUid: string): Promise<void> => {
  try {
    const pocketRef = doc(db, 'pockets', pocketId);
    const pocketDoc = await getDoc(pocketRef);
    
    if (!pocketDoc.exists()) {
      throw new Error('Pocket not found');
    }
    
    const pocketData = parsePocketDocument(pocketDoc, pocketId);
    if (!pocketData) {
      throw new Error('Pocket not found');
    }
    
    // Check if user is a participant
    const isParticipant = pocketData.participants && pocketData.participants.includes(userUid);
    const userRole = pocketData.roles && pocketData.roles[userUid];
    
    if (!isParticipant || userRole !== 'provider') {
      throw new Error('Only the provider can delete this pocket');
    }
    
    // Delete all transactions associated with the pocket
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('pocketId', '==', pocketId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    // Delete transactions in batches (Firestore allows max 500 operations per batch)
    const deletePromises = transactionsSnapshot.docs.map(transactionDoc => 
      updateDoc(transactionDoc.ref, { deleted: true, deletedAt: new Date() })
    );
    
    await Promise.all(deletePromises);
    
    // Mark the pocket as deleted (soft delete for safety)
    await updateDoc(pocketRef, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: userUid
    });
    await writeAuditLog({
      actorUid: userUid,
      action: 'pocket.delete',
      targetId: pocketId,
      targetType: 'pocket',
    });
    
    logger.info('Pocket deletion completed by authorized user.', { context: { pocketId, userUid } });
  } catch (error) {
    return sanitizePocketServiceError(
      error,
      ['Pocket not found', 'Only the provider can delete this pocket'],
      'Unable to delete this pocket right now. Please try again later.',
      'Error deleting pocket',
      { pocketId, userUid }
    );
  }
};

/**
 * Subscribes to real-time pocket metadata updates for a pocket document.
 */
export const subscribeToPocket = (
  pocketId: string,
  callback: (pocket: Pocket | null) => void
) => {
  const pocketDocRef = doc(db, 'pockets', pocketId);

  return createSubscription<Pocket | null>({
    type: 'pocket',
    pocketId,
    keyPrefix: 'pocket',
    subscribe: (onData, onError) => onSnapshot(pocketDocRef, onData, onError),
    processSnapshot: (snapshot) => {
      const snap = snapshot as DocumentSnapshot<DocumentData>;
      return parsePocketDocument(snap, pocketId);
    },
    onDataErrorFallback: () => null,
    callback,
  });
};

/**
 * Cleans up all active Firestore subscriptions managed by this service.
 */
export const cleanupAllSubscriptions = () => {
  if (process.env.NODE_ENV === 'development') {
  logger.debug(`Cleaning up ${activeSubscriptions.size} active subscriptions`);
  }
  
  activeSubscriptions.forEach((entry, id) => {
    try {
      cleanupSubscription(id);
    } catch (error) {
      logger.warn(`Error cleaning up subscription ${id}`, { error, context: { subscriptionId: id } });
    }
  });
  
  activeSubscriptions.clear();
  
  // Reset error tracking
  subscriptionErrorCount = 0;
  lastSuccessfulOperation = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
  logger.debug('All subscriptions cleaned up');
  }
};

// Utility to check subscription health
export const getSubscriptionStats = () => ({
  activeSubscriptions: activeSubscriptions.size,
  errorCount: subscriptionErrorCount,
  lastSuccessfulOperation,
  timeSinceLastSuccess: Date.now() - lastSuccessfulOperation,
    oldestSubscriptionAge: activeSubscriptions.size
      ? Date.now() - Math.min(...Array.from(activeSubscriptions.values()).map(entry => entry.createdAt))
      : 0,
});

/**
 * Returns subscription runtime status for troubleshooting.
 */
export const getSubscriptionHealthDashboard = () => {
  const now = Date.now();
  return Array.from(activeSubscriptions.entries()).map(([id, entry]) => ({
    id,
    type: entry.type,
    pocketId: entry.pocketId,
    ageMs: now - entry.createdAt,
    expiresInMs: Math.max(0, SUBSCRIPTION_CONFIG.maxAgeMs - (now - entry.createdAt)),
  }));
};
