'use client';

import React from 'react';
import { getFirebaseConfigStatus } from '@/lib/firebase-init';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const FirebaseStatus: React.FC = () => {
  const { isConfigured, message } = getFirebaseConfigStatus();

  if (isConfigured) {
    return null; // Don't show anything if Firebase is properly configured
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-600">
            <AlertTriangle className="h-6 w-6" />
            <span>Firebase Configuration Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800">{message}</p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Quick Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Firebase Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Authentication (Email/Password)</li>
              <li>Create Firestore database</li>
              <li>Get your web app configuration</li>
              <li>Update your <code className="bg-gray-100 px-1 rounded">.env.local</code> file</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              📋 <strong>Detailed instructions:</strong> Check the <code>FIREBASE_SETUP.md</code> file in your project root for step-by-step guidance.
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Environment Variables Needed:</h4>
            <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseStatus; 