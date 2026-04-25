'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import MobileModal from '@/components/ui/MobileModal';
import { Transaction } from '@/types';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  isDeleting,
}) => {
  const tT = useTranslations('transactions');
  const tC = useTranslations('common');

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={() => { if (!isDeleting) onClose(); }}
      title={tT('deleteTitle')}
    >
      <div className="p-4 space-y-4">
        <p className="text-gray-700">{tT('deleteConfirm')}</p>
        {transaction && (
          <div className="bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
            {transaction.description}
          </div>
        )}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            {tC('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-all duration-200 font-medium"
          >
            {isDeleting ? tT('deleting') : tC('delete')}
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default DeleteTransactionModal;
