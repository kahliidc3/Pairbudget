'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, Share2, User, Wallet } from 'lucide-react';
import PocketSwitcher from '@/components/PocketSwitcher';
import { Pocket, User as UserProfile } from '@/types';

interface DesktopHeaderProps {
  currentPocket: Pocket;
  userRole: string | undefined;
  userProfile: UserProfile;
  userName: string;
  onInvite: () => void;
  onProfile: () => void;
  onSignOut: () => void;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  currentPocket,
  userRole,
  userProfile,
  userName,
  onInvite,
  onProfile,
  onSignOut,
}) => {
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentPocket.name}</h1>
              <p className="text-sm text-gray-600">
                {userRole === 'provider' ? tDashboard('role.provider') : tDashboard('role.spender')} • {Object.keys(currentPocket.roles).length} {tDashboard('members')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 font-medium">
              {tDashboard('welcome')}, {userProfile.name || userName}
            </div>
            <PocketSwitcher />
            <button
              onClick={onInvite}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title={tDashboard('quickActions.invitePartner')}
              aria-label={tDashboard('quickActions.invitePartner')}
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onProfile}
              className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
              title={tDashboard('quickActions.profile')}
              aria-label={tDashboard('quickActions.profile')}
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={onSignOut}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title={tCommon('signOut')}
              aria-label={tCommon('signOut')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
