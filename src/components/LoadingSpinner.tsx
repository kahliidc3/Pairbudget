'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  showProgress?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text,
  showProgress = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-8 w-8';
    }
  };

  const getBorderWidth = () => {
    switch (size) {
      case 'sm':
        return 'border-2';
      case 'lg':
        return 'border-4';
      default:
        return 'border-2';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Main spinner */}
        <div 
          className={`${getSizeClasses()} ${getBorderWidth()} border-slate-200 border-t-blue-600 rounded-full animate-spin`}
          style={{ animationDuration: '0.8s' }}
        />
        
        {/* Optional progress ring */}
        {showProgress && (
          <div 
            className={`${getSizeClasses()} ${getBorderWidth()} absolute inset-0 border-transparent border-t-slate-400 rounded-full animate-spin opacity-50`}
            style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}
          />
        )}
      </div>
      
      {text && (
        <p className={`mt-3 text-slate-600 animate-pulse ${
          size === 'sm' ? 'text-sm' : 
          size === 'lg' ? 'text-lg' : 'text-base'
        }`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 