'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { error, context: { errorInfo } });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', padding: '1rem' }}>
          <div className="card card-padded" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--red-soft)', border: '1px solid var(--red-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <AlertTriangle size={28} style={{ color: 'var(--red)' }} />
            </div>

            <h2 className="t-head" style={{ fontSize: '1.25rem', marginBottom: '.6rem' }}>Something went wrong</h2>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>

            <button onClick={this.resetError} className="btn btn-primary">
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '1.75rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Error Details (Development)
                </summary>
                <div style={{ marginTop: '.6rem', padding: '.85rem', background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                  <pre style={{ fontSize: '.7rem', color: 'var(--red)', overflow: 'auto', maxHeight: '160px', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
