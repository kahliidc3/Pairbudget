'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import MobileModal from '@/components/ui/MobileModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Transaction } from '@/types';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen, onClose, transaction, onConfirm, isDeleting,
}) => {
  const tT = useTranslations('transactions');
  const tC = useTranslations('common');

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title={tT('deleteTitle')}>
      <div className="modal-body">
        <p style={{ color: 'var(--text-mid)', marginBottom: '.85rem' }}>{tT('deleteConfirm')}</p>
        {transaction && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '.75rem .9rem', borderRadius: 'var(--r)', fontSize: '.875rem', color: 'var(--text-mid)' }}>
            {transaction.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.25rem' }}>
          <button type="button" onClick={onClose} disabled={isDeleting} className="btn btn-ghost" style={{ flex: 1 }}>
            {tC('cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="btn btn-red-solid" style={{ flex: 1 }}>
            {isDeleting ? <LoadingSpinner size="sm" /> : (
              <>
                <Trash2 size={14} />
                <span>{tC('delete')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default DeleteTransactionModal;
