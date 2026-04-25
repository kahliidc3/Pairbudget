'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Pocket, User } from '@/types';

interface MobileHeaderProps {
  currentPocket: Pocket | null;
  userProfile: User | null;
  onPocketSelect: () => void;
}

const WalletIcon = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
);

const MobileHeader: React.FC<MobileHeaderProps> = ({ currentPocket, userProfile, onPocketSelect }) => {
  const tDashboard = useTranslations('dashboard');
  const router = useRouter();
  const locale = useLocale();
  const userRole = currentPocket?.roles[userProfile?.uid || ''] || '';

  return (
    <div className="mhead">
      {currentPocket ? (
        <button type="button" className="pocket-sel" onClick={onPocketSelect} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: '.875rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentPocket.name}
            </div>
            <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>
              {tDashboard(`role.${userRole || 'spender'}`)} · {formatCurrency(currentPocket.balance, { locale, currency: userProfile?.preferredCurrency })}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        </button>
      ) : (
        <button type="button" className="pocket-sel" onClick={onPocketSelect} style={{ flex: 1 }}>
          <WalletIcon />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{tDashboard('pocket.noPocketSelected')}</div>
          </div>
        </button>
      )}
      <button
        type="button"
        onClick={() => router.push(`/${locale}/profile`)}
        className="btn btn-icon btn-ghost"
        aria-label="Profile"
      >
        <UserIcon size={15} />
      </button>
    </div>
  );
};

export default MobileHeader;
