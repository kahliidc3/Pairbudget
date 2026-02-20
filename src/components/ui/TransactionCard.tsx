'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { 
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Tag,
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
}

const TransactionCardComponent: React.FC<TransactionCardProps> = ({
  transaction,
  userName,
  currency,
  delay = 0,
  onClick
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
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
            <div className={`text-lg font-bold ml-3 ${
              isFund ? 'text-green-600' : 'text-orange-600'
            }`}>
              {isFund ? '+' : '-'}{formatCurrency(transaction.amount, { locale, currency })}
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
    </motion.div>
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
  prev.onClick === next.onClick;

const TransactionCard = React.memo(TransactionCardComponent, propsAreEqual);

export default TransactionCard;
