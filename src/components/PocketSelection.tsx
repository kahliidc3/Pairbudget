'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { logger } from '@/lib/logger';
import { getPocket } from '@/services/pocketService';
import { signOut, updateUserProfile } from '@/services/authService';
import LanguageSelector from '@/components/LanguageSelector';
import LoadingSpinner from '@/components/LoadingSpinner';
import PocketList from '@/components/pocket-setup/PocketList';
import { LogOut } from 'lucide-react';
import { Pocket } from '@/types';
import PocketSetup from '@/components/PocketSetup';

const LogoMark = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
);

const PocketSelection: React.FC = () => {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();
  const router = useRouter();
  const locale = useLocale();
  const [userPockets, setUserPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [loadingPocketId, setLoadingPocketId] = useState<string | null>(null);

  const pocketIds = useMemo(() => userProfile?.pocketIds || [], [userProfile?.pocketIds]);

  useEffect(() => {
    let isMounted = true;
    const loadUserPockets = async () => {
      if (pocketIds.length === 0) { setUserPockets([]); setLoading(false); return; }
      try {
        const pockets = await Promise.all(
          pocketIds.map(async (pocketId) => {
            try {
              return (await Promise.race([
                getPocket(pocketId),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
              ])) as Pocket | null;
            } catch (err) {
              logger.warn('Failed to load pocket', { error: err, context: { pocketId } });
              return null;
            }
          })
        );
        if (!isMounted) return;
        setUserPockets(pockets.filter((p): p is Pocket => p !== null));
      } catch (err) {
        logger.error('Error loading user pockets', { error: err });
        if (isMounted) setUserPockets([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadUserPockets();
    return () => { isMounted = false; };
  }, [pocketIds]);

  const handlePocketSelect = useCallback(async (pocket: Pocket) => {
    if (!user || !userProfile || loadingPocketId) return;
    setLoadingPocketId(pocket.id);
    try {
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      setCurrentPocket(pocket);
    } catch (err) {
      logger.error('Error selecting pocket', { error: err });
    } finally {
      setLoadingPocketId(null);
    }
  }, [user, userProfile, setUserProfile, setCurrentPocket, loadingPocketId]);

  const handleSignOut = async () => {
    try { await signOut(); router.push(`/${locale}`); }
    catch (err) { logger.error('Error signing out', { error: err }); }
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.altKey && (event.key === 'h' || event.key === 'H')) {
        event.preventDefault();
        router.push(`/${locale}/dashboard`);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [locale, router]);

  if (showCreateNew) return <PocketSetup isModal={false} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <nav className="nav">
        <button type="button" className="nav-logo" onClick={() => router.push(`/${locale}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <div className="nav-mark"><LogoMark /></div>
          <span className="nav-name">PairBudget</span>
        </button>
        <div className="nav-spacer" />
        <div className="nav-right">
          <span className="nav-user">Welcome, <strong>{userProfile?.name || user?.displayName || user?.email?.split('@')[0]}</strong></span>
          <LanguageSelector />
          <button type="button" onClick={handleSignOut} className="btn btn-ghost btn-sm" aria-label="Sign Out">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="pockets-inner">
        <div className="page-top-row">
          <div>
            <span className="pt-eye">My Pockets</span>
            <div className="pt-title">Choose Your Pocket</div>
            <div className="pt-sub">
              You have {userPockets.length} pocket{userPockets.length !== 1 ? 's' : ''} available — select one to continue.
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <LoadingSpinner size="lg" text="Loading your pockets..." />
          </div>
        ) : (
          <PocketList
            pockets={userPockets}
            onSelect={handlePocketSelect}
            onDelete={() => { /* Disabled in selection view */ }}
            onCreate={() => setShowCreateNew(true)}
            locale={locale}
            preferredCurrency={userProfile?.preferredCurrency}
            isLoading={!!loadingPocketId}
          />
        )}
      </div>
    </div>
  );
};

export default PocketSelection;
