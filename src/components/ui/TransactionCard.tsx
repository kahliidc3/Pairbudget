'use client';

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { 
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Pencil,
  Tag,
  Trash2,
  User
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transaction } from '@/types';

interface TransactionCardProps {
  transaction: Transaction;
  userName?: string;
  currency?: string;
  delay?: number;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const TransactionCardComponent: React.FC<TransactionCardProps> = ({
  transaction,
  userName,
  currency,
  delay = 0,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const locale = useLocale();
  const isFund = transaction.type === 'fund';
  const cardClassName = useMemo(
    () =>
      `bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`,
    [onClick]
  );

  return (
    <div
      data-delay={delay}
      onClick={onClick}
      className={cardClassName}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isFund 
            ? 'bg-green-100 text-green-600' 
            : 'bg-orange-100 text-orange-600'
        }`}>
          {isFund ? (
            <ArrowUpRight className="w-6 h-6" />
          ) : (
            <ArrowDownRight className="w-6 h-6" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-base truncate">
                {transaction.description}
              </h3>
              
              {/* Category */}
              {transaction.category && (
                <div className="flex items-center mt-1">
                  <Tag className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {transaction.category}
                  </span>
                </div>
              )}
            </div>
            
            {/* Amount */}
            <div className="ml-3 flex flex-col items-end gap-2">
              <div className={`text-lg font-bold ${
                isFund ? 'text-green-600' : 'text-orange-600'
              }`}>
                {isFund ? '+' : '-'}{formatCurrency(transaction.amount, { locale, currency })}
              </div>
              {showActions && (onEdit || onDelete) ? (
                <div className="flex items-center gap-1">
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit();
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Edit transaction"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete();
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {userName && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{userName}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(transaction.date, locale)}</span>
            </div>
          </div>
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
  prev.delay === next.delay &&
  prev.onClick === next.onClick &&
  prev.onEdit === next.onEdit &&
  prev.onDelete === next.onDelete &&
  prev.showActions === next.showActions;

const TransactionCard = React.memo(TransactionCardComponent, propsAreEqual);

export default TransactionCard;
