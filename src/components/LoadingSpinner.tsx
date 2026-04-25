'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  /** @deprecated kept for backwards compat */
  showProgress?: boolean;
}

const SIZE_PX: Record<string, number> = { sm: 16, md: 28, lg: 44 };
const BORDER_WIDTH: Record<string, number> = { sm: 2, md: 2.5, lg: 3.5 };

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', text }) => {
  const px = SIZE_PX[size];
  const bw = BORDER_WIDTH[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="spinner-circle"
        style={{
          width: px,
          height: px,
          borderWidth: bw,
        }}
      />
      {text && (
        <p style={{ marginTop: '.75rem', color: 'var(--text-muted)', fontSize: size === 'sm' ? '.8rem' : '.9rem' }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
