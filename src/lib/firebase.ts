import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, clearIndexedDbPersistence, terminate, waitForPendingWrites } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { logger } from './logger';

const requiredEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingEnvVars = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  const message = `Missing Firebase environment variables: ${missingEnvVars.join(', ')}`;
  logger.error(message);
  throw new Error(message);
}

const firebaseConfig = {
  apiKey: requiredEnv.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: requiredEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: requiredEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: requiredEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: requiredEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: requiredEnv.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Track recovery attempts and subscription health
let recoveryAttempts = 0;
let lastRecoveryTime = 0;
let subscriptionHealthState = 'healthy';
const MAX_RECOVERY_ATTEMPTS = 5;
const RECOVERY_COOLDOWN = 30000; // 30 seconds

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR) {
  try {
    // Only connect to emulators if they haven't been connected already
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch {
    logger.debug('Emulators already connected or not available');
  }
}

// Enhanced Firebase connection recovery utilities
export const resetFirestoreConnection = async (aggressive = false) => {
  try {
    logger.debug(`${aggressive ? 'Aggressively r' : 'R'}esetting Firestore connection...`);
    
    // Wait for any pending writes before disrupting connection
    try {
      await waitForPendingWrites(db);
    } catch (error) {
      logger.warn('Could not wait for pending writes', { error });
    }
    
    // Disable network first
    await disableNetwork(db);
    
    // Longer delay for aggressive recovery
    const delay = aggressive ? 2000 : 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Re-enable network
    await enableNetwork(db);
    
    logger.debug('Firestore connection reset successfully');
    
    // Reset recovery tracking if successful
    if (subscriptionHealthState === 'corrupted') {
      subscriptionHealthState = 'recovering';
    }
    
  } catch (error) {
    logger.warn('Error resetting Firestore connection', { error });
    throw error;
  }
};

export const clearFirestoreCache = async () => {
  try {
    logger.debug('Clearing Firestore cache...');
    
    // Disable network first
    await disableNetwork(db);
    
    // Clear the IndexedDB persistence
    await clearIndexedDbPersistence(db);
    
    // Longer delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Re-enable network
    await enableNetwork(db);
    
    logger.debug('Firestore cache cleared successfully');
    
    // Mark as recovering from cache clear
    subscriptionHealthState = 'recovering';
    
  } catch (error) {
    logger.warn('Error clearing Firestore cache', { error });
    // If clearing fails, try just resetting the connection
    try {
      await resetFirestoreConnection(true);
    } catch (resetError) {
        logger.warn('Error during fallback connection reset', { error: resetError });
    }
  }
};

export const terminateAndReinitializeFirestore = async () => {
  try {
    logger.debug('Terminating and reinitializing Firestore instance...');
    
    // Wait for pending writes
    try {
      await waitForPendingWrites(db);
    } catch (error) {
      logger.warn('Could not wait for pending writes during termination', { error });
    }
    
    // Terminate the instance
    await terminate(db);
    
    // Wait before reinitializing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Note: In a real scenario, you'd need to reinitialize the Firestore instance
    // This is a limitation of the current Firebase SDK - termination is mostly permanent
    logger.info('Firestore terminated - app needs restart for full recovery');
    
    return true;
  } catch (error) {
    logger.warn('Error terminating Firestore', { error });
    return false;
  }
};

export const performMemoryCleanup = async () => {
  try {
    logger.debug('Performing memory cleanup...');
    
    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as typeof window & { gc: () => void }).gc();
    }
    
    // Clear any cached data
    if (typeof localStorage !== 'undefined') {
      // Remove Firebase-related cached data
      const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('firebase') || key.includes('firestore')
      );
      firebaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          logger.warn(`Could not remove localStorage key ${key}`, { error });
        }
      });
    }
    
    logger.debug('Memory cleanup completed');
  } catch (error) {
    logger.warn('Error during memory cleanup', { error });
  }
};

// Enhanced error handler with progressive recovery strategies
export const handleFirebaseInternalError = async (error: Error | unknown) => {
  logger.error('Firebase internal error detected', { error });
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as Record<string, unknown>)?.code as string || '';
  
  // Check for specific internal assertion failures
  const isInternalAssertion = errorMessage.includes('INTERNAL ASSERTION FAILED') || 
                            errorCode.includes('internal') ||
                            errorMessage.includes('Unexpected state');
                            
  const isSubscriptionError = errorMessage.includes('ID: ca9') || 
                            errorMessage.includes('ID: b815') || 
                            errorMessage.includes('Fe:-1');
  
  if (isInternalAssertion || isSubscriptionError) {
    logger.info('Attempting to recover from Firebase internal error...');
    
    // Check if we're in a recovery cooldown period
    const now = Date.now();
    if (now - lastRecoveryTime < RECOVERY_COOLDOWN) {
      logger.info('Still in recovery cooldown, skipping recovery attempt');
      return false;
    }
    
    // Check if we've exceeded max recovery attempts
    if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      logger.error('Max recovery attempts exceeded, manual intervention required');
      subscriptionHealthState = 'failed';
      
      // Suggest page reload to user
      if (typeof window !== 'undefined') {
        const shouldReload = confirm(
          'The app has encountered a critical error. Would you like to reload the page to recover?'
        );
        if (shouldReload) {
          window.location.reload();
        }
      }
      return false;
    }
    
    lastRecoveryTime = now;
    recoveryAttempts++;
    subscriptionHealthState = 'corrupted';
    
    try {
      // Progressive recovery strategy based on attempt number
      if (recoveryAttempts === 1) {
        // First attempt: Simple connection reset
        logger.info('Recovery attempt 1: Simple connection reset');
        await resetFirestoreConnection(false);
        
      } else if (recoveryAttempts === 2) {
        // Second attempt: Aggressive connection reset
        logger.info('Recovery attempt 2: Aggressive connection reset');
        await resetFirestoreConnection(true);
        
      } else if (recoveryAttempts === 3) {
        // Third attempt: Clear cache and reset
        logger.info('Recovery attempt 3: Clear cache and reset');
        await clearFirestoreCache();
        
      } else if (recoveryAttempts === 4) {
        // Fourth attempt: Memory cleanup and cache clear
        logger.info('Recovery attempt 4: Memory cleanup and cache clear');
        await performMemoryCleanup();
        await clearFirestoreCache();
        
      } else {
        // Final attempt: Terminate and suggest restart
        logger.info('Recovery attempt 5: Terminate and suggest restart');
        await terminateAndReinitializeFirestore();
      }
      
      // Wait a bit longer after recovery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info(`Recovery attempt ${recoveryAttempts} completed`);
      return true;
      
    } catch (recoveryError) {
      logger.warn(`Recovery attempt ${recoveryAttempts} failed`, { error: recoveryError });
      return false;
    }
  }
  
  return false; // Not a recoverable error
};

// Utility to check subscription health
export const getSubscriptionHealthState = () => subscriptionHealthState;

// Utility to reset recovery tracking (call when app is working normally)
export const resetRecoveryTracking = () => {
  recoveryAttempts = 0;
  lastRecoveryTime = 0;
  subscriptionHealthState = 'healthy';
  logger.info('Recovery tracking reset - subscriptions healthy');
};

// Emergency reset function (can be called manually via console or hotkey)
export const emergencyFirebaseReset = async () => {
  logger.warn('Emergency Firebase reset initiated');
  try {
    await performMemoryCleanup();
    await clearFirestoreCache();
    resetRecoveryTracking();
    logger.info('Emergency reset completed');
    return true;
  } catch (error) {
    logger.error('Emergency reset failed', { error });
    return false;
  }
};

// Global error handler for uncaught Firebase errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (message.includes('FIRESTORE') && message.includes('INTERNAL ASSERTION FAILED')) {
        logger.warn('Caught unhandled Firebase error, attempting recovery', { error });
        handleFirebaseInternalError(error);
        // Prevent the error from being logged to console
        event.preventDefault();
      }
    }
  });
  
  // Register emergency hotkey (Ctrl+Shift+R)
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      logger.info('Emergency Firebase reset hotkey triggered');
      emergencyFirebaseReset();
    }
  });
}

export default app; 
