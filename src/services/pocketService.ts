import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  increment,
  getDocs,
  runTransaction,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, handleFirebaseInternalError, getSubscriptionHealthState, resetRecoveryTracking } from '@/lib/firebase';
import { Pocket, Transaction, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { generateSecureRandomString } from '@/lib/secureRandom';
import { enforceRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

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
const MAX_SUBSCRIPTION_AGE_MS = 5 * 60 * 1000; // 5 minutes

const MAX_TRANSACTION_AMOUNT = 1_000_000;

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
  }, MAX_SUBSCRIPTION_AGE_MS);

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
  const maxRetries = 5;
  const maxConsecutiveErrors = 3;

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

    const baseDelay = consecutiveErrors > 0 && subscriptionErrorCount > 5 ? 5000 : 1000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 30000);
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
              }, 3000);
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
            setTimeout(() => retrySubscription(), 2000);
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
  logContext: string
): never => {
  if (error instanceof Error && allowedMessages.includes(error.message)) {
    throw error;
  }

  logger.error(logContext, { error });
  throw new Error(fallbackMessage);
};

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
    sanitizePocketServiceError(
      error,
      [],
      'Unable to create pocket right now. Please try again later.',
      'Error creating pocket'
    );
  }
};

export const joinPocket = async (inviteCode: string, userUid: string, role: UserRole) => {
  try {
    enforceRateLimit({
      key: `join-pocket:${userUid}`,
      windowMs: 60_000,
      maxRequests: 5,
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
    const pocketData = pocketDoc.data() as Pocket;

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

    return { ...pocketData, participants: [...pocketData.participants, userUid] };
  } catch (error) {
    sanitizePocketServiceError(
      error,
      [
        'Invalid invite code',
        'You are already a member of this pocket',
        'This pocket is already full',
        'Too many requests. Please try again soon.',
      ],
      'Unable to join pocket right now. Please try again later.',
      'Error joining pocket'
    );
  }
};

export const getPocket = async (pocketId: string): Promise<Pocket | null> => {
  try {
    const pocketDoc = await getDoc(doc(db, 'pockets', pocketId));
    if (pocketDoc.exists()) {
      const data = pocketDoc.data();
      const pocket = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate(),
      } as Pocket;
      
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
      windowMs: 30_000,
      maxRequests: 10,
    });

    const normalizedAmount = Number(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > MAX_TRANSACTION_AMOUNT) {
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

      const pocketData = pocketSnapshot.data() as Pocket;

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
    sanitizePocketServiceError(
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
      'Error adding transaction'
    );
  }
};

export interface PaginatedTransactionsResult {
  transactions: Transaction[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const fetchTransactionsPage = async (
  pocketId: string,
  pageSize = 20,
  cursor?: QueryDocumentSnapshot
): Promise<PaginatedTransactionsResult> => {
  try {
    const constraints = [
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

    const transactions = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Transaction;
    });

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      transactions,
      cursor: lastDoc,
      hasMore: snapshot.size === pageSize,
    };
  } catch (error) {
    sanitizePocketServiceError(
      error,
      [],
      'Unable to load transactions right now. Please try again later.',
      'Error fetching paginated transactions'
    );
  }
};

export const subscribeToTransactions = (
  pocketId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('pocketId', '==', pocketId),
    orderBy('date', 'desc')
  );

  return createSubscription<Transaction[]>({
    type: 'transactions',
    pocketId,
    keyPrefix: 'transactions',
    subscribe: (onData, onError) => onSnapshot(transactionsQuery, onData, onError),
    processSnapshot: (snapshot) => {
      const querySnapshot = snapshot as { forEach: (fn: (doc: any) => void) => void };
      const transactions: Transaction[] = [];
      (querySnapshot as any).forEach((doc: any) => {
        const data = doc.data();
        transactions.push({
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Transaction);
      });
      return transactions;
    },
    onDataErrorFallback: () => [],
    callback,
  });
};

export const leavePocket = async (pocketId: string, userUid: string): Promise<void> => {
  try {
    const pocketRef = doc(db, 'pockets', pocketId);
    const pocketDoc = await getDoc(pocketRef);
    
    if (!pocketDoc.exists()) {
      throw new Error('Pocket not found');
    }
    
    const pocketData = pocketDoc.data() as Pocket;
    
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
    
    logger.debug('Pocket departure completed for current user.', { context: { pocketId, userUid } });
  } catch (error) {
    sanitizePocketServiceError(
      error,
      ['Pocket not found'],
      'Unable to leave this pocket right now. Please try again later.',
      'Error leaving pocket'
    );
  }
};

export const deletePocket = async (pocketId: string, userUid: string): Promise<void> => {
  try {
    const pocketRef = doc(db, 'pockets', pocketId);
    const pocketDoc = await getDoc(pocketRef);
    
    if (!pocketDoc.exists()) {
      throw new Error('Pocket not found');
    }
    
    const pocketData = pocketDoc.data() as Pocket;
    
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
    
    logger.info('Pocket deletion completed by authorized user.', { context: { pocketId, userUid } });
  } catch (error) {
    sanitizePocketServiceError(
      error,
      ['Pocket not found', 'Only the provider can delete this pocket'],
      'Unable to delete this pocket right now. Please try again later.',
      'Error deleting pocket'
    );
  }
};

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
      const snap = snapshot as { exists: () => boolean; data: () => any };
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Pocket;
    },
    onDataErrorFallback: () => null,
    callback,
  });
};

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

export const getSubscriptionHealthDashboard = () => {
  const now = Date.now();
  return Array.from(activeSubscriptions.entries()).map(([id, entry]) => ({
    id,
    type: entry.type,
    pocketId: entry.pocketId,
    ageMs: now - entry.createdAt,
    expiresInMs: Math.max(0, MAX_SUBSCRIPTION_AGE_MS - (now - entry.createdAt)),
  }));
};
