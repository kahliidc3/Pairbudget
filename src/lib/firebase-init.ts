// Helper to check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  // Get environment variables directly
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  // Check if all required variables exist and are not placeholder values
  const isValid = apiKey && 
    authDomain && 
    projectId && 
    storageBucket && 
    messagingSenderId && 
    appId &&
    apiKey !== 'your-actual-api-key-here' && 
    apiKey !== 'demo-api-key' &&
    authDomain !== 'your-project.firebaseapp.com' &&
    projectId !== 'your-project-id';

  // Only log in development and limit frequency (browser only)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const now = Date.now();
    const lastLogKey = 'firebase_config_last_log';
    const lastLog = parseInt(localStorage.getItem(lastLogKey) || '0');
    
    // Only log once every 30 seconds to avoid spam
    if (now - lastLog > 30000) {
      console.log('Firebase config check:', {
        hasApiKey: !!apiKey,
        hasAuthDomain: !!authDomain,
        hasProjectId: !!projectId,
        hasStorageBucket: !!storageBucket,
        hasMessagingSenderId: !!messagingSenderId,
        hasAppId: !!appId,
        isValid
      });
      localStorage.setItem(lastLogKey, now.toString());
    }
  }

  return !!isValid;
}

export function getFirebaseConfigStatus(): {
  isConfigured: boolean;
  missingVars: string[];
  message: string;
} {
  const envVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const missingVars = Object.entries(envVars)
    .filter(([, value]) => {
      return !value || value === 'your-actual-api-key-here' || value === 'demo-api-key' || value === 'your-project.firebaseapp.com' || value === 'your-project-id';
    })
    .map(([key]) => key);

  const isConfigured = missingVars.length === 0;

  // Only log in development to reduce console spam
  if (process.env.NODE_ENV === 'development' && missingVars.length > 0) {
    console.log('Environment variables status:', envVars);
    console.log('Missing variables:', missingVars);
  }

  let message = '';
  if (!isConfigured) {
    message = `Firebase not configured. Missing or invalid environment variables: ${missingVars.join(', ')}. Please check FIREBASE_SETUP.md for instructions.`;
  }

  return {
    isConfigured,
    missingVars,
    message,
  };
} 