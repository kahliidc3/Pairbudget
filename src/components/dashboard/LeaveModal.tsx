'use client';

import React from 'react';
import { RefreshCw, UserMinus } from 'lucide-react';
import MobileModal from '@/components/ui/MobileModal';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLeaving: boolean;
}

const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onConfirm, isLeaving }) => (
  <MobileModal isOpen={isOpen} onClose={onClose} title="Leave Pocket">
    <div className="p-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserMinus className="w-8 h-8 text-red-600" />
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Are you sure you want to leave?</h4>
        <p className="text-gray-600">
          You will lose access to this pocket and all its transactions. You can rejoin later with an invite link.
        </p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onClose}
          disabled={isLeaving}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLeaving}
          className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
        >
          {isLeaving ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /><span>Leaving...</span></>
          ) : (
            <span>Leave Pocket</span>
          )}
        </button>
      </div>
    </div>
  </MobileModal>
);

export default LeaveModal;
