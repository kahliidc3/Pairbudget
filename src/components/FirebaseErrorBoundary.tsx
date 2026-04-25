'use client';

import React, { Component, ReactNode } from 'react';
import { 
  emergencyFirebaseReset, 
  getSubscriptionHealthState, 
  handleFirebaseInternalError,
  resetRecoveryTracking
} from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { cleanupAllSubscriptions, getSubscriptionStats } from '@/services/pocketService';
import { Activity, AlertTriangle, Monitor, RefreshCw, RotateCcw, Zap } from 'lucide-react';

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
}

class FirebaseErrorBoundary extends Component<Props, State> {
  private isRecoveringNow = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      showDiagnostics: false,
      recoveryAttempts: 0,
    };
  }

  componentDidMount() {
    // Set up global error listeners for Firebase errors
    this.setupGlobalErrorHandlers();
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  setupGlobalErrorHandlers = () => {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Listen for global errors
    window.addEventListener('error', this.handleGlobalError);
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    if (this.isFirebaseInternalError(error)) {
      logger.warn('FirebaseErrorBoundary caught unhandled Firebase error');
      this.handleFirebaseError(error);
      event.preventDefault(); // Prevent the error from being logged
    }
  };

  handleGlobalError = (event: ErrorEvent) => {
    if (this.isFirebaseInternalError(event.error)) {
      logger.warn('FirebaseErrorBoundary caught global Firebase error');
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
    if (this.isRecoveringNow || this.state.isRecovering) {
      logger.debug('Already recovering from Firebase error, skipping');
      return;
    }

    logger.error('FirebaseErrorBoundary handling error', { error });
    this.isRecoveringNow = true;
    
    this.setState((prevState) => ({
      isRecovering: true,
      recoveryAttempts: prevState.recoveryAttempts + 1
    }));

    try {
      const recovered = await handleFirebaseInternalError(error);
      
      if (recovered) {
        logger.info('Firebase error recovery successful');
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
        logger.warn('Firebase error recovery failed');
      }
    } catch (recoveryError) {
      logger.error('Error during Firebase recovery', { error: recoveryError });
    } finally {
      this.isRecoveringNow = false;
      this.setState({ isRecovering: false });
    }
  };

  static getDerivedStateFromError(error: Error): Partial<State> | null {
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

    // Ignore non-Firebase errors in this boundary to avoid re-entrant update loops.
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('FirebaseErrorBoundary caught error', { error, context: { errorInfo } });
    
    if (this.isFirebaseInternalError(error)) {
      this.setState({
        hasError: true,
        error,
        errorInfo,
      });
    }

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
          logger.info('Manual cleanup triggered');
          cleanupAllSubscriptions();
          break;
          
        case 'reset':
          logger.info('Manual reset triggered');
          resetRecoveryTracking();
          cleanupAllSubscriptions();
          break;
          
        case 'emergency':
          logger.info('Emergency reset triggered');
          await emergencyFirebaseReset();
          cleanupAllSubscriptions();
          break;
          
        case 'reload':
          logger.info('Page reload triggered');
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
      logger.error('Manual recovery failed', { error });
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
      recoveryAttempts
    } = this.state;

    if (hasError && error) {
      const subscriptionStats = getSubscriptionStats();
      const healthState = getSubscriptionHealthState();
      const isInternalAssertion = error.message?.includes('INTERNAL ASSERTION FAILED');
      const errorId = error.message?.match(/ID: (ca9|b815)/)?.[1];
      
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', padding: '1rem' }}>
          <div className="card card-padded" style={{ maxWidth: 520, width: '100%', padding: '2.25rem 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--red-soft)', border: '1px solid var(--red-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={28} style={{ color: 'var(--red)' }} />
              </div>
              <h2 className="t-head" style={{ fontSize: '1.4rem', marginBottom: '.5rem' }}>Database Connection Issue</h2>

              {isInternalAssertion && (
                <div className="alert alert-error" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>Internal Assertion Failure {errorId && `(ID: ${errorId})`}</p>
                    <p style={{ fontSize: '.75rem', marginTop: '.2rem' }}>Subscription state corrupted — automatic recovery in progress</p>
                  </div>
                </div>
              )}

              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                {isRecovering
                  ? 'Attempting to recover connection...'
                  : "We're experiencing connectivity issues with the database. Please try one of the recovery options below."}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', fontSize: '.8rem', marginBottom: '.5rem' }}>
                <div className="card" style={{ padding: '.6rem .75rem', boxShadow: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Health</span>
                  <span className="tag tag-amber">{healthState}</span>
                </div>
                <div className="card" style={{ padding: '.6rem .75rem', boxShadow: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Attempts</span>
                  <strong>{recoveryAttempts}</strong>
                </div>
              </div>
            </div>

            {isRecovering ? (
              <div style={{ textAlign: 'center' }}>
                <div className="alert alert-success" style={{ display: 'inline-flex' }}>
                  <RefreshCw size={14} className="spin" />
                  <span style={{ fontWeight: 600 }}>Recovering...</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                <button onClick={() => this.handleManualRecovery('cleanup')} className="btn btn-primary" style={{ width: '100%' }}>
                  <RefreshCw size={14} /> <span>Retry Connection</span>
                </button>
                <button onClick={() => this.handleManualRecovery('reset')} className="btn btn-secondary" style={{ width: '100%' }}>
                  <RotateCcw size={14} /> <span>Reset Subscriptions</span>
                </button>
                <button onClick={() => this.handleManualRecovery('emergency')} className="btn btn-red-solid" style={{ width: '100%' }}>
                  <Zap size={14} /> <span>Emergency Reset</span>
                </button>
                <button onClick={() => this.handleManualRecovery('reload')} className="btn btn-ghost" style={{ width: '100%' }}>
                  <Monitor size={14} /> <span>Reload Page</span>
                </button>
                <button onClick={this.toggleDiagnostics} className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                  <Activity size={13} /> <span>{showDiagnostics ? 'Hide' : 'Show'} Diagnostics</span>
                </button>
              </div>
            )}

            {showDiagnostics && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                <h3 className="t-head" style={{ fontSize: '.95rem', marginBottom: '.85rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Activity size={14} /> System Diagnostics
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', fontSize: '.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Active Subscriptions:</span>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{subscriptionStats.activeSubscriptions}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Error Count:</span>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{subscriptionStats.errorCount}</div>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Last Success:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {new Date(subscriptionStats.lastSuccessfulOperation).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Time Since Success:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {Math.round(subscriptionStats.timeSinceLastSuccess / 1000)}s
                    </div>
                  </div>
                  <div style={{ paddingTop: '.85rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Error Details:</span>
                    <pre style={{ fontSize: '.7rem', background: '#fff', padding: '.6rem', borderRadius: 'var(--r-sm)', marginTop: '.4rem', overflowX: 'auto', border: '1px solid var(--border)', color: 'var(--red)' }}>
                      {error.message}
                    </pre>
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                    Press <kbd style={{ padding: '.1rem .4rem', background: 'var(--c-100)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--f-head)', fontSize: '.7rem' }}>Ctrl+Shift+R</kbd> for emergency reset
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
