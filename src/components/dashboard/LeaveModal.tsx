'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import MobileModal from '@/components/ui/MobileModal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLeaving: boolean;
}

const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onConfirm, isLeaving }) => {
  const tC = useTranslations('common');

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Leave Pocket">
      <div className="modal-body">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--red-soft)', border: '1px solid var(--red-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '.85rem' }}>
            <LogOut size={26} style={{ color: 'var(--red)' }} />
          </div>
          <h4 className="t-head" style={{ fontSize: '1.05rem', marginBottom: '.4rem' }}>Are you sure you want to leave?</h4>
          <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            You will lose access to this pocket and all its transactions. You can rejoin later with an invite link.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button type="button" onClick={onClose} disabled={isLeaving} className="btn btn-ghost" style={{ flex: 1 }}>
            {tC('cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={isLeaving} className="btn btn-red-solid" style={{ flex: 1 }}>
            {isLeaving ? <LoadingSpinner size="sm" /> : 'Leave Pocket'}
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default LeaveModal;
