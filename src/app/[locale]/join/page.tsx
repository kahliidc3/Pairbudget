'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/lib/logger';
import { joinPocket } from '@/services/pocketService';
import { updateUserProfile } from '@/services/authService';
import { usePocketStore } from '@/store/pocketStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import LanguageSelector from '@/components/LanguageSelector';
import RoleSelector from '@/components/pocket-setup/RoleSelector';
import { UserRole } from '@/types';
import { AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

const LogoMark = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
);

function JoinPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('spender');
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (!user) router.push(`/${locale}`);
  }, [user, router, locale]);

  const handleJoin = async () => {
    if (!user || !userProfile || !inviteCode) return;
    setLoading(true);
    setError('');
    try {
      const pocket = await joinPocket(inviteCode, user.uid, selectedRole);
      if (!pocket) throw new Error('Unable to join pocket right now.');
      const updatedPocketIds = [...(userProfile.pocketIds || []), pocket.id];
      await updateUserProfile(user.uid, { currentPocketId: pocket.id, pocketIds: updatedPocketIds });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id, pocketIds: updatedPocketIds });
      setCurrentPocket(pocket);
      router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      logger.error('Error joining pocket', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="nav">
        <button type="button" className="nav-logo" onClick={() => router.push(`/${locale}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <div className="nav-mark"><LogoMark /></div>
          <span className="nav-name">PairBudget</span>
        </button>
        <div className="nav-spacer" />
        <div className="nav-right">
          <LanguageSelector />
          <button type="button" onClick={() => router.push(`/${locale}/dashboard`)} className="btn btn-ghost btn-sm">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="setup-wrap">
        {!inviteCode ? (
          <div className="card card-padded" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--red-soft)', border: '1px solid var(--red-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertCircle size={28} style={{ color: 'var(--red)' }} />
            </div>
            <h2 className="t-head" style={{ fontSize: '1.4rem', marginBottom: '.5rem' }}>Invalid Invite Link</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              This invite link is not valid or has expired. Please ask your partner to send you a new invite link.
            </p>
            <button type="button" onClick={() => router.push(`/${locale}/dashboard`)} className="btn btn-primary">
              <ArrowLeft size={15} /> Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <span className="setup-kicker">Join Pocket</span>
            <h1 className="setup-h">You&apos;ve been invited!</h1>
            <p className="setup-sub">Join the shared pocket using the invite code <strong style={{ color: 'var(--primary)', fontFamily: 'var(--f-head)' }}>{inviteCode}</strong> and pick your role.</p>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <span className="field-label" style={{ display: 'block', marginBottom: '.65rem' }}>Your Role</span>
            <RoleSelector value={selectedRole} onChange={setSelectedRole} />

            <button type="button" onClick={handleJoin} disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? <LoadingSpinner size="sm" /> : (
                <>
                  <UserPlus size={15} />
                  <span>Join Pocket</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" />
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
}
