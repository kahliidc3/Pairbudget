'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/types';

interface TransactionCardProps {
  transaction: Transaction;
  userName?: string;
  currency?: string;
  /** @deprecated kept for backwards compat — no longer used */
  delay?: number;
  /** @deprecated kept for backwards compat — no longer used */
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const ArrowUp = () => (
  <svg viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
);
const ArrowDn = () => (
  <svg viewBox="0 0 24 24"><line x1="7" y1="7" x2="17" y2="17" /><polyline points="17 7 17 17 7 17" /></svg>
);

const categoryTagClass = (cat?: string): string => {
  if (!cat) return 'tag-green';
  const lower = cat.toLowerCase();
  if (lower.includes('grocer') || lower.includes('food')) return 'tag-green';
  if (lower.includes('bill') || lower.includes('utility') || lower.includes('rent')) return 'tag-amber';
  return 'tag-green';
};

const TransactionCardComponent: React.FC<TransactionCardProps> = ({
  transaction, userName, currency, onEdit, onDelete, showActions = false,
}) => {
  const locale = useLocale();
  const isFund = transaction.type === 'fund';

  return (
    <div className="tx-row">
      <div className={`tx-dir ${isFund ? 'up' : 'dn'}`}>
        {isFund ? <ArrowUp /> : <ArrowDn />}
      </div>
      <div className="tx-body">
        {/* Line 1: name + amount */}
        <div className="tx-top">
          <span className="tx-name">{transaction.description}</span>
          <span className={`tx-amt ${isFund ? 'up' : 'dn'}`}>
            {isFund ? '+' : '−'}{formatCurrency(transaction.amount, { locale, currency })}
          </span>
        </div>
        {/* Line 2: meta + actions */}
        <div className="tx-bottom">
          <div className="tx-meta">
            {transaction.category && (
              <span className={`tag ${categoryTagClass(transaction.category)}`}>
                {transaction.category}
              </span>
            )}
            {userName && <span className="tx-user">{userName}</span>}
            <span className="tx-date">{formatDate(transaction.date, locale)}</span>
          </div>
          {showActions && (
            <div className="tx-acts">
              {onEdit && (
                <button type="button" onClick={onEdit} className="btn btn-icon btn-ghost btn-sm" aria-label="Edit transaction">
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={onDelete} className="btn btn-icon btn-red btn-sm" aria-label="Delete transaction">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const propsAreEqual = (prev: TransactionCardProps, next: TransactionCardProps) =>
  prev.transaction.id === next.transaction.id &&
  prev.transaction.type === next.transaction.type &&
  prev.transaction.amount === next.transaction.amount &&
  prev.transaction.description === next.transaction.description &&
  prev.transaction.category === next.transaction.category &&
  prev.transaction.date?.getTime?.() === next.transaction.date?.getTime?.() &&
  prev.userName === next.userName &&
  prev.currency === next.currency &&
  prev.onEdit === next.onEdit &&
  prev.onDelete === next.onDelete &&
  prev.showActions === next.showActions;

const TransactionCard = React.memo(TransactionCardComponent, propsAreEqual);

export default TransactionCard;
