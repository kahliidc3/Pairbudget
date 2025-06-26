'use client';

import React, { Component, ReactNode } from 'react';
import { 
  handleFirebaseInternalError, 
  getSubscriptionHealthState, 
  resetRecoveryTracking,
  emergencyFirebaseReset
} from '@/lib/firebase';
import { getSubscriptionStats, cleanupAllSubscriptions } from '@/services/pocketService';
import { AlertTriangle, Activity, RefreshCw, RotateCcw, Zap, Monitor } from 'lucide-react';

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

  getHealthStateColor = (state: string) => {
    switch (state) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'recovering':
        return 'text-yellow-600 bg-yellow-50';
      case 'corrupted':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-lg w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Database Connection Issue
              </h2>
              
              {isInternalAssertion && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 font-semibold">
                    Internal Assertion Failure {errorId && `(ID: ${errorId})`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Subscription state corrupted - automatic recovery in progress
                  </p>
                </div>
              )}
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                {isRecovering 
                  ? 'Attempting to recover connection...'
                  : 'We\'re experiencing connectivity issues with the database. Please try one of the recovery options below.'
                }
              </p>
              
              {/* Status Indicators */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Health Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${this.getHealthStateColor(healthState)}`}>
                      {healthState}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Attempts</span>
                    <span className="text-slate-900 font-semibold">{recoveryAttempts}</span>
                  </div>
                </div>
              </div>
            </div>

            {isRecovering ? (
              <div className="text-center">
                <div className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  <RefreshCw className="animate-spin w-4 h-4 mr-3" />
                  <span className="font-medium">Recovering...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => this.handleManualRecovery('cleanup')}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Connection</span>
                </button>
                
                <button
                  onClick={() => this.handleManualRecovery('reset')}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Subscriptions</span>
                </button>
                
                <button
                  onClick={() => this.handleManualRecovery('emergency')}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Emergency Reset</span>
                </button>
                
                <button
                  onClick={() => this.handleManualRecovery('reload')}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Reload Page</span>
                </button>
                
                <button
                  onClick={this.toggleDiagnostics}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors text-sm border border-slate-200"
                >
                  <Activity className="w-4 h-4" />
                  <span>{showDiagnostics ? 'Hide' : 'Show'} Diagnostics</span>
                </button>
              </div>
            )}

            {showDiagnostics && (
              <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  System Diagnostics
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-600">Active Subscriptions:</span>
                      <div className="font-semibold text-slate-900">{subscriptionStats.activeSubscriptions}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Error Count:</span>
                      <div className="font-semibold text-slate-900">{subscriptionStats.errorCount}</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-slate-600">Last Success:</span>
                    <div className="font-semibold text-slate-900">
                      {new Date(subscriptionStats.lastSuccessfulOperation).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-slate-600">Time Since Success:</span>
                    <div className="font-semibold text-slate-900">
                      {Math.round(subscriptionStats.timeSinceLastSuccess / 1000)}s
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <span className="text-slate-600">Error Details:</span>
                    <pre className="text-xs bg-white p-3 rounded mt-2 overflow-x-auto border border-slate-200 text-red-600">
                      {error.message}
                    </pre>
                  </div>
                  
                  <div className="pt-2 text-xs text-slate-500">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">Ctrl+Shift+R</kbd> for emergency reset
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