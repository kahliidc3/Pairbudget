'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { 
  Bell, 
  ChevronDown,
  Search,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Pocket, User } from '@/types';

interface MobileHeaderProps {
  currentPocket: Pocket | null;
  userProfile: User | null;
  onPocketSelect: () => void;
  onNotifications?: () => void;
  onSearch?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentPocket,
  userProfile,
  onPocketSelect,
  onNotifications,
  onSearch
}) => {
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const balance = currentPocket?.balance || 0;
  const userRole = currentPocket?.roles[userProfile?.uid || ''] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? tCommon('morning') : hour < 18 ? tCommon('afternoon') : tCommon('evening');
  const userLabel = userProfile?.name || tCommon('user');

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="px-4 py-4">
        {/* Top Row: Greeting and Actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">{greeting}</p>
            <p className="font-semibold text-gray-900 truncate max-w-[200px]">
              {userLabel}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onSearch && (
              <button
                onClick={onSearch}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            {onNotifications && (
              <button
                onClick={onNotifications}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
            )}
          </div>
        </div>

        {/* Pocket Selection */}
        {currentPocket ? (
          <button
            onClick={onPocketSelect}
            className="w-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-base truncate max-w-[180px]">
                    {currentPocket.name}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {tDashboard(`role.${userRole || 'spender'}`)} • {Object.keys(currentPocket.roles).length} {tDashboard('members')}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">{tDashboard('stats.currentBalance')}</p>
                <p className={`text-lg font-bold ${
                  balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(balance), { locale, currency: userProfile?.preferredCurrency })}
                </p>
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={onPocketSelect}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-gray-100 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tDashboard('pocket.noPocketSelected')}</p>
                <p className="text-sm text-gray-500">{tDashboard('pocket.tapToSelect')}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
