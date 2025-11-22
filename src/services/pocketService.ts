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
} from 'firebase/firestore';
import { db, handleFirebaseInternalError, getSubscriptionHealthState, resetRecoveryTracking } from '@/lib/firebase';
import { Pocket, Transaction, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { generateSecureRandomString } from '@/lib/secureRandom';
import { enforceRateLimit } from '@/lib/rateLimiter';
import { logger } from '@/lib/logger';

const activeSubscriptions = new Map<string, () => void>();
let subscriptionErrorCount = 0;
let lastSuccessfulOperation = Date.now();
const MAX_TRANSACTION_AMOUNT = 1_000_000;

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

export const subscribeToTransactions = (
  pocketId: string,
  callback: (transactions: Transaction[]) => void
) => {
  const subscriptionId = `transactions_${pocketId}_${Date.now()}`;
  let isActive = true;
  let unsubscribeFunction: (() => void) | null = null;
  let retryCount = 0;
  let consecutiveErrors = 0;
  const maxRetries = 5;
  const maxConsecutiveErrors = 3;
  
  // Clean up any existing subscription for this pocket
  const existingKey = Array.from(activeSubscriptions.keys()).find(key => key.startsWith(`transactions_${pocketId}`));
  if (existingKey) {
    const existingUnsub = activeSubscriptions.get(existingKey);
    if (existingUnsub) {
      try {
        existingUnsub();
      } catch (error) {
        logger.warn('Error cleaning up existing transaction subscription', { error, context: { pocketId } });
      }
    }
    activeSubscriptions.delete(existingKey);
  }
  
  const setupSubscription = () => {
    try {
  const q = query(
    collection(db, 'transactions'),
    where('pocketId', '==', pocketId)
      );

      unsubscribeFunction = onSnapshot(
        q, 
        (querySnapshot) => {
          if (!isActive) return;
          
          try {
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        ...data,
        id: doc.id,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Transaction);
    });
    
            // Client-side sorting by date (most recent first)
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            // Debug log for transactions
            logger.debug(`Received ${transactions.length} transactions for pocket ${pocketId}`);
            
            // Reset error counts on successful data
            retryCount = 0;
            consecutiveErrors = 0;
            subscriptionErrorCount = Math.max(0, subscriptionErrorCount - 1);
            lastSuccessfulOperation = Date.now();
            
            // Reset recovery tracking if we've been healthy for a while
            if (getSubscriptionHealthState() === 'recovering') {
              resetRecoveryTracking();
            }
    
    callback(transactions);
          } catch (error) {
            logger.error('Error processing transactions data', { error, context: { pocketId } });
            consecutiveErrors++;
            
            // Handle data processing errors
            if (consecutiveErrors >= maxConsecutiveErrors) {
              logger.warn('Too many consecutive data processing errors, recreating subscription', { context: { pocketId } });
              retrySubscription();
            } else if (isActive) {
              callback([]);
            }
          }
        },
        (error: unknown) => {
          if (!isActive) return;
          
          logger.error('Transaction subscription error', { error, context: { pocketId } });
          consecutiveErrors++;
          subscriptionErrorCount++;
          
          // Check for specific Firebase internal assertion failures
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isInternalAssertion = errorMessage.includes('INTERNAL ASSERTION FAILED');
          const isSubscriptionCorruption = errorMessage.includes('ID: ca9') || 
                                         errorMessage.includes('ID: b815') || 
                                         errorMessage.includes('Fe:-1') ||
                                         errorMessage.includes('Unexpected state');
          
          if (isInternalAssertion || isSubscriptionCorruption) {
            logger.warn('Detected Firebase internal assertion failure in subscription', { context: { pocketId } });
            
            // Immediately attempt Firebase-level recovery
            handleFirebaseInternalError(error).then((recovered) => {
              if (recovered && isActive) {
                logger.info('Firebase recovery successful, recreating subscription', { context: { pocketId } });
                // Wait a bit longer before retrying after internal assertion failure
                setTimeout(() => {
                  if (isActive) {
                    retrySubscription();
                  }
                }, 3000);
              } else if (isActive) {
                logger.warn('Firebase recovery failed, using exponential backoff', { context: { pocketId } });
                retrySubscription();
              }
            });
            
          } else {
            // Handle other types of errors with exponential backoff
            retrySubscription();
          }
        }
      );
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Transaction subscription ${subscriptionId} established for pocket ${pocketId}`);
      }
      
    } catch (error) {
      logger.error('Error setting up transaction subscription', { error, context: { pocketId } });
      
      // Check if this is an internal assertion error during setup
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

  const retrySubscription = () => {
    if (!isActive || retryCount >= maxRetries) {
      logger.error(`Transaction subscription ${subscriptionId} failed after ${maxRetries} attempts`, { context: { pocketId } });
      
      // If we're hitting max retries due to internal assertions, suggest recovery
      if (consecutiveErrors >= maxConsecutiveErrors) {
        logger.warn('Subscription consistently failing, may need manual recovery', { context: { pocketId } });
        
        // Call empty callback to indicate subscription failure
        if (isActive) {
          callback([]);
        }
      }
      return;
    }

    retryCount++;
    
    // Clean up current subscription if it exists
    if (unsubscribeFunction) {
      try {
        unsubscribeFunction();
      } catch (error) {
        logger.warn('Error during subscription cleanup', { error, context: { subscriptionId } });
      }
      unsubscribeFunction = null;
    }

    // Exponential backoff with jitter, longer delays for internal assertion failures
    const baseDelay = consecutiveErrors > 0 && subscriptionErrorCount > 5 ? 5000 : 1000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 30000);
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;

    logger.debug(`Retrying transaction subscription ${subscriptionId} in ${Math.round(delay)}ms (attempt ${retryCount}/${maxRetries})`, { context: { pocketId } });
    
    setTimeout(() => {
      if (isActive) {
        setupSubscription();
      }
    }, delay);
  };

  // Initial setup
  setupSubscription();

  const cleanupFunction = () => {
    isActive = false;
    if (unsubscribeFunction) {
      try {
        unsubscribeFunction();
      } catch (error) {
        logger.warn('Error during transaction subscription cleanup', { error, context: { subscriptionId } });
      }
    }
    activeSubscriptions.delete(subscriptionId);
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Transaction subscription ${subscriptionId} cleaned up`, { context: { pocketId } });
    }
  };

  activeSubscriptions.set(subscriptionId, cleanupFunction);
  return cleanupFunction;
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
  const subscriptionId = `pocket_${pocketId}_${Date.now()}`;
  let isActive = true;
  let unsubscribeFunction: (() => void) | null = null;
  let retryCount = 0;
  let consecutiveErrors = 0;
  const maxRetries = 5;
  const maxConsecutiveErrors = 3;
  
  // Clean up any existing subscription for this pocket
  const existingKey = Array.from(activeSubscriptions.keys()).find(key => key.startsWith(`pocket_${pocketId}`));
  if (existingKey) {
    const existingUnsub = activeSubscriptions.get(existingKey);
    if (existingUnsub) {
      try {
        existingUnsub();
      } catch (error) {
        logger.warn('Error cleaning up existing pocket subscription', { error, context: { pocketId } });
      }
    }
    activeSubscriptions.delete(existingKey);
  }

  const setupSubscription = () => {
    try {
      unsubscribeFunction = onSnapshot(
        doc(db, 'pockets', pocketId),
        (doc) => {
          if (!isActive) return;
          
          try {
    if (doc.exists()) {
      const data = doc.data();
              const pocket: Pocket = {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Pocket;
              
              // Reset error counts on successful data
              retryCount = 0;
              consecutiveErrors = 0;
              subscriptionErrorCount = Math.max(0, subscriptionErrorCount - 1);
              lastSuccessfulOperation = Date.now();
              
              // Reset recovery tracking if we've been healthy for a while
              if (getSubscriptionHealthState() === 'recovering') {
                resetRecoveryTracking();
              }
              
      callback(pocket);
    } else {
      callback(null);
            }
          } catch (error) {
            logger.error('Error processing pocket data', { error, context: { pocketId } });
            consecutiveErrors++;
            
            if (consecutiveErrors >= maxConsecutiveErrors) {
              logger.warn('Too many consecutive pocket data processing errors, recreating subscription', { context: { pocketId } });
              retrySubscription();
            } else if (isActive) {
              callback(null);
            }
          }
        },
        (error: unknown) => {
          if (!isActive) return;
          
          logger.error('Pocket subscription error', { error, context: { pocketId } });
          consecutiveErrors++;
          subscriptionErrorCount++;
          
          // Check for specific Firebase internal assertion failures
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isInternalAssertion = errorMessage.includes('INTERNAL ASSERTION FAILED');
          const isSubscriptionCorruption = errorMessage.includes('ID: ca9') || 
                                         errorMessage.includes('ID: b815') || 
                                         errorMessage.includes('Fe:-1') ||
                                         errorMessage.includes('Unexpected state');
          
          if (isInternalAssertion || isSubscriptionCorruption) {
            logger.warn('Detected Firebase internal assertion failure in pocket subscription', { context: { pocketId } });
            
            // Immediately attempt Firebase-level recovery
            handleFirebaseInternalError(error).then((recovered) => {
              if (recovered && isActive) {
                logger.info('Firebase recovery successful, recreating pocket subscription', { context: { pocketId } });
                setTimeout(() => {
                  if (isActive) {
                    retrySubscription();
                  }
                }, 3000);
              } else if (isActive) {
                logger.warn('Firebase recovery failed, using exponential backoff', { context: { pocketId } });
                retrySubscription();
              }
            });
            
          } else {
            retrySubscription();
          }
        }
      );
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Pocket subscription ${subscriptionId} established`, { context: { pocketId } });
      }
      
    } catch (error) {
      logger.error('Error setting up pocket subscription', { error, context: { pocketId } });
      
      // Check if this is an internal assertion error during setup
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

  const retrySubscription = () => {
    if (!isActive || retryCount >= maxRetries) {
      logger.error(`Pocket subscription ${subscriptionId} failed after ${maxRetries} attempts`, { context: { pocketId } });
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        logger.warn('Pocket subscription consistently failing, may need manual recovery', { context: { pocketId } });
        if (isActive) {
          callback(null);
        }
      }
      return;
    }

    retryCount++;
    
    // Clean up current subscription if it exists
    if (unsubscribeFunction) {
      try {
        unsubscribeFunction();
      } catch (error) {
        logger.warn('Error during pocket subscription cleanup', { error, context: { subscriptionId } });
      }
      unsubscribeFunction = null;
    }

    // Exponential backoff with jitter
    const baseDelay = consecutiveErrors > 0 && subscriptionErrorCount > 5 ? 5000 : 1000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 30000);
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;

    logger.debug(`Retrying pocket subscription ${subscriptionId} in ${Math.round(delay)}ms (attempt ${retryCount}/${maxRetries})`, { context: { pocketId } });
    
    setTimeout(() => {
      if (isActive) {
        setupSubscription();
      }
    }, delay);
  };

  // Initial setup
  setupSubscription();

  const cleanupFunction = () => {
    isActive = false;
    if (unsubscribeFunction) {
      try {
        unsubscribeFunction();
      } catch (error) {
        logger.warn('Error during pocket subscription cleanup', { error, context: { subscriptionId } });
      }
    }
    activeSubscriptions.delete(subscriptionId);
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Pocket subscription ${subscriptionId} cleaned up`, { context: { pocketId } });
    }
  };

  activeSubscriptions.set(subscriptionId, cleanupFunction);
  return cleanupFunction;
};

export const cleanupAllSubscriptions = () => {
  if (process.env.NODE_ENV === 'development') {
  logger.debug(`Cleaning up ${activeSubscriptions.size} active subscriptions`);
  }
  
  activeSubscriptions.forEach((cleanup, id) => {
    try {
      cleanup();
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
  timeSinceLastSuccess: Date.now() - lastSuccessfulOperation
}); 
