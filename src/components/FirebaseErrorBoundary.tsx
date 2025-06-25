'use client';

import React, { Component, ReactNode } from 'react';
import { 
  handleFirebaseInternalError, 
  getSubscriptionHealthState, 
  resetRecoveryTracking,
  emergencyFirebaseReset
} from '@/lib/firebase';
import { getSubscriptionStats, cleanupAllSubscriptions } from '@/services/pocketService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isRecovering: boolean;
  showDiagnostics: boolean;
  recoveryAttempts: number;
  subscriptionStats: {
    activeSubscriptions: number;
    errorCount: number;
    lastSuccessfulOperation: number;
    timeSinceLastSuccess: number;
  };
}

class FirebaseErrorBoundary extends Component<Props, State> {
  private diagnosticsInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      showDiagnostics: false,
      recoveryAttempts: 0,
      subscriptionStats: {
        activeSubscriptions: 0,
        errorCount: 0,
        lastSuccessfulOperation: Date.now(),
        timeSinceLastSuccess: 0
      }
    };
  }

  componentDidMount() {
    // Set up global error listeners for Firebase errors
    this.setupGlobalErrorHandlers();
    
    // Start diagnostics monitoring
    this.startDiagnosticsMonitoring();
  }

  componentWillUnmount() {
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
    }
  }

  setupGlobalErrorHandlers = () => {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Listen for global errors
    window.addEventListener('error', this.handleGlobalError);
  };

  startDiagnosticsMonitoring = () => {
    this.diagnosticsInterval = setInterval(() => {
      this.setState({
        subscriptionStats: getSubscriptionStats()
      });
    }, 5000); // Update every 5 seconds
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    if (this.isFirebaseInternalError(error)) {
      console.warn('FirebaseErrorBoundary caught unhandled Firebase error');
      this.handleFirebaseError(error);
      event.preventDefault(); // Prevent the error from being logged
    }
  };

  handleGlobalError = (event: ErrorEvent) => {
    if (this.isFirebaseInternalError(event.error)) {
      console.warn('FirebaseErrorBoundary caught global Firebase error');
      this.handleFirebaseError(event.error);
    }
  };

  isFirebaseInternalError = (error: unknown): boolean => {
    if (!error) return false;
    
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('FIRESTORE') && 
           (message.includes('INTERNAL ASSERTION FAILED') ||
            message.includes('ID: ca9') ||
            message.includes('ID: b815') ||
            message.includes('Fe:-1') ||
            message.includes('Unexpected state'));
  };

  handleFirebaseError = async (error: unknown) => {
    if (this.state.isRecovering) {
      console.log('Already recovering from Firebase error, skipping');
      return;
    }

    console.error('FirebaseErrorBoundary handling error:', error);
    
    this.setState({ 
      isRecovering: true,
      recoveryAttempts: this.state.recoveryAttempts + 1
    });

    try {
      const recovered = await handleFirebaseInternalError(error);
      
      if (recovered) {
        console.log('Firebase error recovery successful');
        // Reset error state after successful recovery
        setTimeout(() => {
          if (this.state.hasError) {
            this.setState({
              hasError: false,
              error: null,
              errorInfo: null,
              isRecovering: false
            });
          }
        }, 2000);
      } else {
        console.warn('Firebase error recovery failed');
      }
    } catch (recoveryError) {
      console.error('Error during Firebase recovery:', recoveryError);
    } finally {
      this.setState({ isRecovering: false });
    }
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a Firebase internal error
    const message = error.message || '';
    const isFirebaseError = message.includes('FIRESTORE') && 
                           (message.includes('INTERNAL ASSERTION FAILED') ||
                            message.includes('ID: ca9') ||
                            message.includes('ID: b815') ||
                            message.includes('Fe:-1'));
    
    if (isFirebaseError) {
      return {
        hasError: true,
        error,
      };
    }

    // For non-Firebase errors, let them bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FirebaseErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Attempt recovery for Firebase errors
    if (this.isFirebaseInternalError(error)) {
      this.handleFirebaseError(error);
    }
  }

  handleManualRecovery = async (recoveryType: string) => {
    this.setState({ isRecovering: true });
    
    try {
      switch (recoveryType) {
        case 'cleanup':
          console.log('Manual cleanup triggered');
          cleanupAllSubscriptions();
          break;
          
        case 'reset':
          console.log('Manual reset triggered');
          resetRecoveryTracking();
          cleanupAllSubscriptions();
          break;
          
        case 'emergency':
          console.log('Emergency reset triggered');
          await emergencyFirebaseReset();
          cleanupAllSubscriptions();
          break;
          
        case 'reload':
          console.log('Page reload triggered');
          window.location.reload();
          return;
      }
      
      // Clear error state after manual recovery
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryAttempts: 0
      });
      
    } catch (error) {
      console.error('Manual recovery failed:', error);
    } finally {
      this.setState({ isRecovering: false });
    }
  };

  toggleDiagnostics = () => {
    this.setState({ showDiagnostics: !this.state.showDiagnostics });
  };

  render() {
    const { 
      hasError, 
      error, 
      isRecovering, 
      showDiagnostics, 
      recoveryAttempts,
      subscriptionStats 
    } = this.state;

    if (hasError && error) {
      const healthState = getSubscriptionHealthState();
      const isInternalAssertion = error.message?.includes('INTERNAL ASSERTION FAILED');
      const errorId = error.message?.match(/ID: (ca9|b815)/)?.[1];
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-red-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Firebase Connection Issue
              </h2>
              
              {isInternalAssertion && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 font-semibold">
                    Internal Assertion Failure {errorId && `(ID: ${errorId})`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Subscription state corrupted - automatic recovery in progress
                  </p>
                </div>
              )}
              
              <p className="text-gray-600 text-sm mb-4">
                {isRecovering 
                  ? 'Attempting to recover connection...'
                  : 'We\'re experiencing connectivity issues with the database.'
                }
              </p>
              
              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <div>Health: <span className={`font-semibold ${
                  healthState === 'healthy' ? 'text-green-600' :
                  healthState === 'recovering' ? 'text-yellow-600' :
                  healthState === 'corrupted' ? 'text-red-600' : 'text-gray-600'
                }`}>{healthState}</span></div>
                <div>Recovery attempts: <span className="font-semibold">{recoveryAttempts}</span></div>
                <div>Active subscriptions: <span className="font-semibold">{subscriptionStats.activeSubscriptions}</span></div>
              </div>
            </div>

            {isRecovering ? (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Recovering...
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => this.handleManualRecovery('cleanup')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Retry Connection
                </button>
                
                <button
                  onClick={() => this.handleManualRecovery('reset')}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reset Subscriptions
                </button>
                
                <button
                  onClick={() => this.handleManualRecovery('emergency')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Emergency Reset
                </button>
                
                <button
                  onClick={() => this.handleManualRecovery('reload')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Reload Page
                </button>
                
                <button
                  onClick={this.toggleDiagnostics}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                </button>
              </div>
            )}

            {showDiagnostics && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-3">Diagnostics</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Error:</span>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                      {error.message}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium">Error Count:</span> {subscriptionStats.errorCount}
                  </div>
                  <div>
                    <span className="font-medium">Last Success:</span> {
                      new Date(subscriptionStats.lastSuccessfulOperation).toLocaleTimeString()
                    }
                  </div>
                  <div>
                    <span className="font-medium">Time Since Success:</span> {
                      Math.round(subscriptionStats.timeSinceLastSuccess / 1000)
                    }s
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Shift+R</kbd> for emergency reset
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary; 