'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, LogOut, Share2, User as UserIcon } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import { Pocket, User as UserProfile } from '@/types';

interface DesktopHeaderProps {
  currentPocket: Pocket;
  userRole: string | undefined;
  userProfile: UserProfile;
  userName: string;
  onInvite: () => void;
  onProfile: () => void;
  onSignOut: () => void;
  onPocketSwitcher?: () => void;
}

const LogoMark = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
);

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  currentPocket, userRole, userProfile, userName, onInvite, onProfile, onSignOut, onPocketSwitcher,
}) => {
  const router = useRouter();
  const locale = useLocale();
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <nav className="nav">
      <button type="button" className="nav-logo" onClick={() => router.push(`/${locale}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <div className="nav-mark"><LogoMark /></div>
        <span className="nav-name">PairBudget</span>
      </button>

      <button
        type="button"
        className="pocket-sel"
        onClick={onPocketSwitcher ?? (() => router.push(`/${locale}/pocket-setup`))}
        style={{ marginLeft: '.5rem' }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
        </svg>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: '.875rem', fontWeight: 700, color: 'var(--text)' }}>
            {currentPocket.name}
          </div>
          <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>
            {userRole === 'provider' ? tDashboard('role.provider') : tDashboard('role.spender')} · {Object.keys(currentPocket.roles).length} {tDashboard('members')}
          </div>
        </div>
        <ChevronDown size={13} style={{ color: 'var(--text-faint)' }} />
      </button>

      <div className="nav-spacer" />

      <div className="nav-right">
        <span className="nav-user"><strong>{userProfile.name || userName}</strong></span>
        <LanguageSelector />
        <button type="button" onClick={onInvite} className="btn btn-icon btn-ghost" title={tDashboard('quickActions.invitePartner')} aria-label={tDashboard('quickActions.invitePartner')}>
          <Share2 size={15} />
        </button>
        <button type="button" onClick={onProfile} className="btn btn-icon btn-ghost" title={tDashboard('quickActions.profile')} aria-label={tDashboard('quickActions.profile')}>
          <UserIcon size={15} />
        </button>
        <button type="button" onClick={onSignOut} className="btn btn-ghost btn-sm">
          <LogOut size={14} />
          {tCommon('signOut')}
        </button>
      </div>
    </nav>
  );
};

export default DesktopHeader;
