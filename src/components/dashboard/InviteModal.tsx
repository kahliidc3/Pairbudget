'use client';

import React, { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import MobileModal from '@/components/ui/MobileModal';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  inviteLink: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, inviteCode, inviteLink }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Invite Partner">
      <div className="p-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600">
            Share this link with your partner to give them access to this pocket
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Invite Link</p>
              <p className="text-xs text-gray-500 break-all">{inviteLink}</p>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-200"
              aria-label="Copy invite link"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Invite Code: <span className="font-mono font-bold">{inviteCode}</span>
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default InviteModal;
