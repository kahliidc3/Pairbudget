'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import MobileModal from '@/components/ui/MobileModal';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  isOpen, onClose, transaction, onSubmit, isSubmitting,
}) => {
  const tT = useTranslations('transactions');
  const tC = useTranslations('common');

  const [formData, setFormData] = useState<EditFormData>({
    type: 'expense', category: '', description: '', amount: '',
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

  const handleSave = async () => { await onSubmit(formData); };

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title={tT('editTitle')}>
      <div className="modal-body">
        <div className="field">
          <label htmlFor="edit-type" className="field-label">{tT('filterType')}</label>
          <select
            id="edit-type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              type: e.target.value as 'fund' | 'expense',
              category: e.target.value === 'fund' ? '' : prev.category,
            }))}
            className="input-base"
          >
            <option value="fund">{tT('fund')}</option>
            <option value="expense">{tT('expense')}</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="edit-desc" className="field-label">Description</label>
          <input
            id="edit-desc" type="text" maxLength={DESCRIPTION_MAX}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input-base"
          />
          <p style={{ marginTop: '.4rem', fontSize: '.7rem', color: 'var(--text-faint)', textAlign: 'right' }}>
            {formData.description.length}/{DESCRIPTION_MAX}
          </p>
        </div>

        <div className="field">
          <label htmlFor="edit-amount" className="field-label">Amount</label>
          <input
            id="edit-amount" type="number" min="0" step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="input-base"
          />
        </div>

        {formData.type === 'expense' && (
          <div className="field">
            <label htmlFor="edit-cat" className="field-label">Category</label>
            <select
              id="edit-cat"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="input-base"
            >
              <option value="">{tT('allCategories')}</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-ghost" style={{ flex: 1 }}>
          {tC('cancel')}
        </button>
        <button type="button" onClick={handleSave} disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : tT('saveChanges')}
        </button>
      </div>
    </MobileModal>
  );
};

export default EditTransactionModal;
