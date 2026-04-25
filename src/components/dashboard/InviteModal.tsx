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
      <div className="modal-body">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary-soft)', border: '1px solid var(--v-200)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.85rem' }}>
            <Share2 size={26} style={{ color: 'var(--primary)' }} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', lineHeight: 1.5 }}>
            Share this link with your partner so they can join the pocket.
          </p>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '.85rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.6rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="field-label" style={{ marginBottom: '.2rem' }}>Invite Link</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-mid)', wordBreak: 'break-all' }}>{inviteLink}</div>
            </div>
            <button type="button" onClick={handleCopy} className="btn btn-icon btn-ghost" aria-label="Copy invite link">
              {copied ? <Check size={15} style={{ color: 'var(--primary)' }} /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Invite Code: <span style={{ fontFamily: 'var(--f-head)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.05em' }}>{inviteCode}</span>
        </div>

        <button type="button" onClick={onClose} className="btn btn-ghost" style={{ width: '100%' }}>Close</button>
      </div>
    </MobileModal>
  );
};

export default InviteModal;
