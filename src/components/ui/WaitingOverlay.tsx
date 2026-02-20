'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface WaitingOverlayProps {
  isVisible: boolean;
  label?: string;
}

const WaitingOverlay: React.FC<WaitingOverlayProps> = ({ isVisible, label = 'Please wait...' }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[1px] flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="bg-white border border-gray-200 px-5 py-4 shadow-lg flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
    </div>
  );
};

export default WaitingOverlay;

