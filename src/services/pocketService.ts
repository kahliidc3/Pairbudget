import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  increment,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirebaseInternalError, getSubscriptionHealthState, resetRecoveryTracking } from '@/lib/firebase';
import { Pocket, Transaction, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const activeSubscriptions = new Map<string, () => void>();
let subscriptionErrorCount = 0;
let lastSuccessfulOperation = Date.now();

export const createPocket = async (
  name: string,
  creatorUid: string,
  creatorRole: UserRole
): Promise<Pocket> => {
  try {
    const pocketId = uuidv4();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
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
    throw error;
  }
};

export const joinPocket = async (inviteCode: string, userUid: string, role: UserRole) => {
  try {
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
    throw error;
  }
};

export const getPocket = async (pocketId: string): Promise<Pocket | null> => {
  try {
    const pocketDoc = await getDoc(doc(db, 'pockets', pocketId));
    if (pocketDoc.exists()) {
      const data = pocketDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Pocket;
    }
    return null;
  } catch (error) {
    console.error('Error fetching pocket:', error);
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
    const transaction: Omit<Transaction, 'id'> = {
      pocketId,
      userId,
      type,
      category,
      description,
      amount,
      date: new Date(),
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    
    // Update pocket balance
    const balanceChange = type === 'fund' ? amount : -amount;
    const totalField = type === 'fund' ? 'totalFunded' : 'totalSpent';
    
    await updateDoc(doc(db, 'pockets', pocketId), {
      balance: increment(balanceChange),
      [totalField]: increment(amount),
    });

    return { ...transaction, id: docRef.id };
  } catch (error) {
    throw error;
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
        console.warn('Error cleaning up existing transaction subscription:', error);
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
            if (process.env.NODE_ENV === 'development') {
              console.log(`Received ${transactions.length} transactions for pocket ${pocketId}`);
            }
            
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
            console.error('Error processing transactions data:', error);
            consecutiveErrors++;
            
            // Handle data processing errors
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.warn('Too many consecutive data processing errors, recreating subscription');
              retrySubscription();
            } else if (isActive) {
              callback([]);
            }
          }
        },
        (error: unknown) => {
          if (!isActive) return;
          
          console.error('Transaction subscription error:', error);
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
            console.warn('Detected Firebase internal assertion failure in subscription');
            
            // Immediately attempt Firebase-level recovery
            handleFirebaseInternalError(error).then((recovered) => {
              if (recovered && isActive) {
                console.log('Firebase recovery successful, recreating subscription');
                // Wait a bit longer before retrying after internal assertion failure
                setTimeout(() => {
                  if (isActive) {
                    retrySubscription();
                  }
                }, 3000);
              } else if (isActive) {
                console.warn('Firebase recovery failed, using exponential backoff');
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
        console.log(`Transaction subscription ${subscriptionId} established for pocket ${pocketId}`);
      }
      
    } catch (error) {
      console.error('Error setting up transaction subscription:', error);
      
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
      console.error(`Transaction subscription ${subscriptionId} failed after ${maxRetries} attempts`);
      
      // If we're hitting max retries due to internal assertions, suggest recovery
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.warn('Subscription consistently failing, may need manual recovery');
        
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
        console.warn('Error during subscription cleanup:', error);
      }
      unsubscribeFunction = null;
    }

    // Exponential backoff with jitter, longer delays for internal assertion failures
    const baseDelay = consecutiveErrors > 0 && subscriptionErrorCount > 5 ? 5000 : 1000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 30000);
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;

    console.log(`Retrying transaction subscription ${subscriptionId} in ${Math.round(delay)}ms (attempt ${retryCount}/${maxRetries})`);
    
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
        console.warn('Error during transaction subscription cleanup:', error);
      }
    }
    activeSubscriptions.delete(subscriptionId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Transaction subscription ${subscriptionId} cleaned up`);
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
      console.warn('User appears to not be a member, but proceeding with cleanup anyway');
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
    
    console.log(`User ${userUid} successfully left pocket ${pocketId}`);
  } catch (error) {
    console.error('Error leaving pocket:', error);
    throw error;
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
        console.warn('Error cleaning up existing pocket subscription:', error);
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
            console.error('Error processing pocket data:', error);
            consecutiveErrors++;
            
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.warn('Too many consecutive pocket data processing errors, recreating subscription');
              retrySubscription();
            } else if (isActive) {
              callback(null);
            }
          }
        },
        (error: unknown) => {
          if (!isActive) return;
          
          console.error('Pocket subscription error:', error);
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
            console.warn('Detected Firebase internal assertion failure in pocket subscription');
            
            // Immediately attempt Firebase-level recovery
            handleFirebaseInternalError(error).then((recovered) => {
              if (recovered && isActive) {
                console.log('Firebase recovery successful, recreating pocket subscription');
                setTimeout(() => {
                  if (isActive) {
                    retrySubscription();
                  }
                }, 3000);
              } else if (isActive) {
                console.warn('Firebase recovery failed, using exponential backoff');
                retrySubscription();
              }
            });
            
          } else {
            retrySubscription();
          }
        }
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Pocket subscription ${subscriptionId} established`);
      }
      
    } catch (error) {
      console.error('Error setting up pocket subscription:', error);
      
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
      console.error(`Pocket subscription ${subscriptionId} failed after ${maxRetries} attempts`);
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.warn('Pocket subscription consistently failing, may need manual recovery');
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
        console.warn('Error during pocket subscription cleanup:', error);
      }
      unsubscribeFunction = null;
    }

    // Exponential backoff with jitter
    const baseDelay = consecutiveErrors > 0 && subscriptionErrorCount > 5 ? 5000 : 1000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1), 30000);
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;

    console.log(`Retrying pocket subscription ${subscriptionId} in ${Math.round(delay)}ms (attempt ${retryCount}/${maxRetries})`);
    
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
        console.warn('Error during pocket subscription cleanup:', error);
      }
    }
    activeSubscriptions.delete(subscriptionId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Pocket subscription ${subscriptionId} cleaned up`);
    }
  };

  activeSubscriptions.set(subscriptionId, cleanupFunction);
  return cleanupFunction;
};

export const cleanupAllSubscriptions = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cleaning up ${activeSubscriptions.size} active subscriptions`);
  }
  
  activeSubscriptions.forEach((cleanup, id) => {
    try {
      cleanup();
    } catch (error) {
      console.warn(`Error cleaning up subscription ${id}:`, error);
    }
  });
  
  activeSubscriptions.clear();
  
  // Reset error tracking
  subscriptionErrorCount = 0;
  lastSuccessfulOperation = Date.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('All subscriptions cleaned up');
  }
};

// Utility to check subscription health
export const getSubscriptionStats = () => ({
  activeSubscriptions: activeSubscriptions.size,
  errorCount: subscriptionErrorCount,
  lastSuccessfulOperation,
  timeSinceLastSuccess: Date.now() - lastSuccessfulOperation
}); 