'use client';

import React from 'react';
import { getFirebaseConfigStatus } from '@/lib/firebase-init';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, ExternalLink, CheckCircle, Settings, Database, Shield } from 'lucide-react';

const FirebaseStatus: React.FC = () => {
  const { isConfigured, message } = getFirebaseConfigStatus();

  if (isConfigured) {
    return null; // Don't show anything if Firebase is properly configured
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-slate-900 mb-2">
            Firebase Configuration Required
          </CardTitle>
          <p className="text-slate-600 max-w-2xl mx-auto">
            PairBudget requires Firebase to be configured for authentication and data storage. 
            Follow the setup steps below to get started.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-800 mb-1">Configuration Status</h3>
                <p className="text-orange-700 text-sm">{message}</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Setup Steps */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Quick Setup Steps
              </h3>
              <ol className="space-y-4">
                {[
                  { 
                    title: "Create Firebase Project", 
                    description: "Go to Firebase Console and create a new project",
                    link: "https://console.firebase.google.com"
                  },
                  { 
                    title: "Enable Authentication", 
                    description: "Enable Email/Password authentication method"
                  },
                  { 
                    title: "Create Firestore Database", 
                    description: "Set up Firestore in production mode"
                  },
                  { 
                    title: "Get Web App Config", 
                    description: "Register a web app and copy the configuration"
                  },
                  { 
                    title: "Update Environment", 
                    description: "Add configuration to your .env.local file"
                  }
                ].map((step, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{step.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                      {step.link && (
                        <a 
                          href={step.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-2 font-medium"
                        >
                          Open Firebase Console
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Required Services */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-green-600" />
                Required Firebase Services
              </h3>
              <div className="space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "Authentication",
                    description: "Email/Password sign-in for user accounts",
                    color: "text-blue-600 bg-blue-50"
                  },
                  {
                    icon: Database,
                    title: "Firestore Database",
                    description: "Real-time database for expenses and budgets",
                    color: "text-green-600 bg-green-50"
                  },
                  {
                    icon: Settings,
                    title: "Web App Registration",
                    description: "Web app configuration for API keys",
                    color: "text-purple-600 bg-purple-50"
                  }
                ].map((service, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border border-slate-200">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${service.color}`}>
                      <service.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{service.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-slate-600" />
              Environment Variables
            </h3>
            <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono leading-relaxed">
{`# Add these to your .env.local file
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456`}
              </pre>
            </div>
          </div>

          {/* Help Links */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Detailed Instructions</h4>
                  <p className="text-blue-800 text-sm">
                    Check the <code className="bg-blue-100 px-1 rounded text-xs">FIREBASE_SETUP.md</code> file 
                    in your project root for comprehensive setup guidance.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1">
              <div className="flex items-start space-x-3">
                <ExternalLink className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Firebase Documentation</h4>
                  <a 
                    href="https://firebase.google.com/docs/web/setup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-800 text-sm hover:text-green-900 underline"
                  >
                    Official Firebase Web Setup Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirebaseStatus; 