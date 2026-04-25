'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import MobileModal from '@/components/ui/MobileModal';
import { EXPENSE_CATEGORIES, Transaction } from '@/types';

interface EditFormData {
  type: 'fund' | 'expense';
  category: string;
  description: string;
  amount: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSubmit: (data: EditFormData) => Promise<void>;
  isSubmitting: boolean;
}

const DESCRIPTION_MAX = 500;

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSubmit,
  isSubmitting,
}) => {
  const tT = useTranslations('transactions');
  const tC = useTranslations('common');

  const [formData, setFormData] = useState<EditFormData>({
    type: 'expense',
    category: '',
    description: '',
    amount: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category ?? '',
        description: transaction.description,
        amount: String(transaction.amount),
      });
    }
  }, [transaction]);

  const handleSave = async () => {
    await onSubmit(formData);
  };

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={() => { if (!isSubmitting) onClose(); }}
      title={tT('editTitle')}
    >
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{tT('filterType')}</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                type: e.target.value as 'fund' | 'expense',
                category: e.target.value === 'fund' ? '' : prev.category,
              }))
            }
            className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          >
            <option value="fund">{tT('fund')}</option>
            <option value="expense">{tT('expense')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            maxLength={DESCRIPTION_MAX}
            className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
          <p className="mt-2 text-xs text-gray-500 text-right">{formData.description.length}/{DESCRIPTION_MAX}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {formData.type === 'expense' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">{tT('allCategories')}</option>
              {EXPENSE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            {tC('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-all duration-200 font-medium"
          >
            {isSubmitting ? tT('updating') : tT('saveChanges')}
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default EditTransactionModal;
