'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import MobileModal from '@/components/ui/MobileModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EXPENSE_CATEGORIES } from '@/types';

interface TransactionFormData {
  type: 'fund' | 'expense';
  category: string;
  description: string;
  amount: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'fund' | 'expense';
  onSubmit: (data: TransactionFormData) => Promise<void>;
  isSubmitting: boolean;
  canAddFunds: boolean;
  canAddExpenses: boolean;
}

const DESCRIPTION_MAX = 500;

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen, onClose, initialType, onSubmit, isSubmitting, canAddFunds, canAddExpenses,
}) => {
  const tT = useTranslations('transactions');
  const tC = useTranslations('common');

  const [formData, setFormData] = useState<TransactionFormData>({
    type: initialType, category: '', description: '', amount: '',
  });

  useEffect(() => {
    if (isOpen) setFormData({ type: initialType, category: '', description: '', amount: '' });
  }, [isOpen, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={formData.type === 'fund' ? 'Add Funds' : 'Record Expense'}
    >
      <form id="add-tx-form" onSubmit={handleSubmit}>
        <div className="modal-body">
          {canAddFunds && canAddExpenses && (
            <div className="tab-toggle" style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                className={`tt-btn ${formData.type === 'fund' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'fund' }))}
              >
                Add Funds
              </button>
              <button
                type="button"
                className={`tt-btn ${formData.type === 'expense' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              >
                Record Expense
              </button>
            </div>
          )}

          <div className="field">
            <label htmlFor="tx-amount" className="field-label">Amount</label>
            <input
              id="tx-amount" type="number" step="0.01" required
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="input-base"
            />
          </div>

          <div className="field">
            <label htmlFor="tx-desc" className="field-label">Description</label>
            <input
              id="tx-desc" type="text" required maxLength={DESCRIPTION_MAX}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={formData.type === 'fund' ? 'Monthly funding' : 'Grocery shopping'}
              className="input-base"
            />
            <p style={{ marginTop: '.4rem', fontSize: '.7rem', color: 'var(--text-faint)', textAlign: 'right' }}>
              {formData.description.length}/{DESCRIPTION_MAX}
            </p>
          </div>

          {formData.type === 'expense' && (
            <div className="field">
              <label htmlFor="tx-cat" className="field-label">Category</label>
              <select
                id="tx-cat" required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-base"
              >
                <option value="">Select a category</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-ghost" style={{ flex: 1 }}>
            {tC('cancel')}
          </button>
          <button type="submit" form="add-tx-form" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
            {isSubmitting ? <LoadingSpinner size="sm" /> : (formData.type === 'fund' ? tT('addFunds') : tT('recordExpense'))}
          </button>
        </div>
      </form>
    </MobileModal>
  );
};

export default AddTransactionModal;
