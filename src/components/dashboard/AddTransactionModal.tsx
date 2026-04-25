'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import MobileModal from '@/components/ui/MobileModal';
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
  isOpen,
  onClose,
  initialType,
  onSubmit,
  isSubmitting,
  canAddFunds,
  canAddExpenses,
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: initialType,
    category: '',
    description: '',
    amount: '',
  });

  // Reset form when modal opens with a new initialType
  useEffect(() => {
    if (isOpen) {
      setFormData({ type: initialType, category: '', description: '', amount: '' });
    }
  }, [isOpen, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const showFundTab = canAddFunds;
  const showExpenseTab = canAddExpenses;

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={formData.type === 'fund' ? 'Add Funds' : 'Record Expense'}
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {showFundTab && showExpenseTab && (
          <div className="bg-gray-100 rounded-xl p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'fund' }))}
                className={`py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  formData.type === 'fund' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Add Funds
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                className={`py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  formData.type === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Record Expense
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder={formData.type === 'fund' ? 'Monthly allowance' : 'Grocery shopping'}
            maxLength={DESCRIPTION_MAX}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
          />
          <p className="mt-2 text-xs text-gray-500 text-right">{formData.description.length}/{DESCRIPTION_MAX}</p>
        </div>

        {formData.type === 'expense' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2 text-base"
          >
            {isSubmitting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /><span>Adding...</span></>
            ) : (
              <span>{formData.type === 'fund' ? 'Add Funds' : 'Record Expense'}</span>
            )}
          </button>
        </div>
      </form>
    </MobileModal>
  );
};

export default AddTransactionModal;
