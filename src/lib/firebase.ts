import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, clearIndexedDbPersistence, terminate, waitForPendingWrites } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
    console.log('Emulators already connected or not available');
  }
}

// Enhanced Firebase connection recovery utilities
export const resetFirestoreConnection = async (aggressive = false) => {
  try {
    console.log(`${aggressive ? 'Aggressively r' : 'R'}esetting Firestore connection...`);
    
    // Wait for any pending writes before disrupting connection
    try {
      await waitForPendingWrites(db);
    } catch (error) {
      console.warn('Could not wait for pending writes:', error);
    }
    
    // Disable network first
    await disableNetwork(db);
    
    // Longer delay for aggressive recovery
    const delay = aggressive ? 2000 : 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Re-enable network
    await enableNetwork(db);
    
    console.log('Firestore connection reset successfully');
    
    // Reset recovery tracking if successful
    if (subscriptionHealthState === 'corrupted') {
      subscriptionHealthState = 'recovering';
    }
    
  } catch (error) {
    console.warn('Error resetting Firestore connection:', error);
    throw error;
  }
};

export const clearFirestoreCache = async () => {
  try {
    console.log('Clearing Firestore cache...');
    
    // Disable network first
    await disableNetwork(db);
    
    // Clear the IndexedDB persistence
    await clearIndexedDbPersistence(db);
    
    // Longer delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Re-enable network
    await enableNetwork(db);
    
    console.log('Firestore cache cleared successfully');
    
    // Mark as recovering from cache clear
    subscriptionHealthState = 'recovering';
    
  } catch (error) {
    console.warn('Error clearing Firestore cache:', error);
    // If clearing fails, try just resetting the connection
    try {
      await resetFirestoreConnection(true);
    } catch (resetError) {
      console.warn('Error during fallback connection reset:', resetError);
    }
  }
};

export const terminateAndReinitializeFirestore = async () => {
  try {
    console.log('Terminating and reinitializing Firestore instance...');
    
    // Wait for pending writes
    try {
      await waitForPendingWrites(db);
    } catch (error) {
      console.warn('Could not wait for pending writes during termination:', error);
    }
    
    // Terminate the instance
    await terminate(db);
    
    // Wait before reinitializing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Note: In a real scenario, you'd need to reinitialize the Firestore instance
    // This is a limitation of the current Firebase SDK - termination is mostly permanent
    console.log('Firestore terminated - app needs restart for full recovery');
    
    return true;
  } catch (error) {
    console.warn('Error terminating Firestore:', error);
    return false;
  }
};

export const performMemoryCleanup = async () => {
  try {
    console.log('Performing memory cleanup...');
    
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
          console.warn(`Could not remove localStorage key ${key}:`, error);
        }
      });
    }
    
    console.log('Memory cleanup completed');
  } catch (error) {
    console.warn('Error during memory cleanup:', error);
  }
};

// Enhanced error handler with progressive recovery strategies
export const handleFirebaseInternalError = async (error: Error | unknown) => {
  console.error('Firebase internal error detected:', error);
  
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
    console.log('Attempting to recover from Firebase internal error...');
    
    // Check if we're in a recovery cooldown period
    const now = Date.now();
    if (now - lastRecoveryTime < RECOVERY_COOLDOWN) {
      console.log('Still in recovery cooldown, skipping recovery attempt');
      return false;
    }
    
    // Check if we've exceeded max recovery attempts
    if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      console.error('Max recovery attempts exceeded, manual intervention required');
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
        console.log('Recovery attempt 1: Simple connection reset');
        await resetFirestoreConnection(false);
        
      } else if (recoveryAttempts === 2) {
        // Second attempt: Aggressive connection reset
        console.log('Recovery attempt 2: Aggressive connection reset');
        await resetFirestoreConnection(true);
        
      } else if (recoveryAttempts === 3) {
        // Third attempt: Clear cache and reset
        console.log('Recovery attempt 3: Clear cache and reset');
        await clearFirestoreCache();
        
      } else if (recoveryAttempts === 4) {
        // Fourth attempt: Memory cleanup and cache clear
        console.log('Recovery attempt 4: Memory cleanup and cache clear');
        await performMemoryCleanup();
        await clearFirestoreCache();
        
      } else {
        // Final attempt: Terminate and suggest restart
        console.log('Recovery attempt 5: Terminate and suggest restart');
        await terminateAndReinitializeFirestore();
      }
      
      // Wait a bit longer after recovery
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`Recovery attempt ${recoveryAttempts} completed`);
      return true;
      
    } catch (recoveryError) {
      console.warn(`Recovery attempt ${recoveryAttempts} failed:`, recoveryError);
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
  console.log('Recovery tracking reset - subscriptions healthy');
};

// Emergency reset function (can be called manually via console or hotkey)
export const emergencyFirebaseReset = async () => {
  console.warn('Emergency Firebase reset initiated');
  try {
    await performMemoryCleanup();
    await clearFirestoreCache();
    resetRecoveryTracking();
    console.log('Emergency reset completed');
    return true;
  } catch (error) {
    console.error('Emergency reset failed:', error);
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
        console.warn('Caught unhandled Firebase error, attempting recovery');
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
      console.log('Emergency Firebase reset hotkey triggered');
      emergencyFirebaseReset();
    }
  });
}

export default app; 