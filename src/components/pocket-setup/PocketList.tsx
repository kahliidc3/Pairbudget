'use client';

import React from 'react';
import { Calendar, Trash2, Users, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pocket } from '@/types';

interface PocketListProps {
  pockets: Pocket[];
  onSelect: (pocket: Pocket) => void;
  onDelete: (pocket: Pocket) => void;
  locale: string;
  preferredCurrency?: string;
  isLoading: boolean;
}

const PocketList: React.FC<PocketListProps> = ({
  pockets,
  onSelect,
  onDelete,
  locale,
  preferredCurrency,
  isLoading,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {pockets.map((pocket) => (
      <div
        key={pocket.id}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <button
            onClick={() => onDelete(pocket)}
            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
            aria-label={`Delete ${pocket.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 truncate">{pocket.name}</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white/90 text-sm">Balance</span>
            <span className={`font-medium ${pocket.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(pocket.balance, { locale, currency: preferredCurrency })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/90 text-sm flex items-center space-x-1">
              <Users className="w-3 h-3" /><span>Members</span>
            </span>
            <span className="text-white font-medium">{pocket.participants.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/90 text-sm flex items-center space-x-1">
              <Calendar className="w-3 h-3" /><span>Created</span>
            </span>
            <span className="text-white/90 text-sm">{formatDate(pocket.createdAt, locale)}</span>
          </div>
        </div>

        <button
          onClick={() => onSelect(pocket)}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 hover:border-white/30 font-medium disabled:opacity-50"
        >
          Select Pocket
        </button>
      </div>
    ))}
  </div>
);

export default PocketList;
