'use client';

import React from 'react';

interface WaitingOverlayProps {
  isVisible: boolean;
  label?: string;
}

const WaitingOverlay: React.FC<WaitingOverlayProps> = ({ isVisible, label = 'Please wait...' }) => {
  if (!isVisible) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 220 }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="card"
        style={{
          padding: '1rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '.85rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="spinner-circle" style={{ width: 18, height: 18, borderWidth: 2 }} />
        <span style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-mid)' }}>{label}</span>
      </div>
    </div>
  );
};

export default WaitingOverlay;
