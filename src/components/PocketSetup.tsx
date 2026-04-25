'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { logger } from '@/lib/logger';
import { createPocket, deletePocket, getPocket, joinPocket } from '@/services/pocketService';
import { addPocketToUser, getUserProfile, removePocketFromUser, signOut } from '@/services/authService';
import { Pocket, UserRole } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import LanguageSelector from '@/components/LanguageSelector';
import CreatePocketForm from '@/components/pocket-setup/CreatePocketForm';
import JoinPocketForm from '@/components/pocket-setup/JoinPocketForm';
import PocketList from '@/components/pocket-setup/PocketList';
import DeletePocketModal from '@/components/pocket-setup/DeletePocketModal';
import { ChevronRight, Home, Plus, UserPlus } from 'lucide-react';

interface PocketSetupProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

const LogoMark = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
);

const PocketSetup: React.FC<PocketSetupProps> = ({ onSuccess, isModal = false }) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('pocketSetup');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  const [mode, setMode] = useState<'create' | 'join' | 'manage'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userPockets, setUserPockets] = useState<Pocket[]>([]);
  const [loadingPockets, setLoadingPockets] = useState(true);
  const [deletingPocketId, setDeletingPocketId] = useState<string | null>(null);
  const [confirmDeletePocket, setConfirmDeletePocket] = useState<Pocket | null>(null);

  const { user, userProfile, setUserProfile } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();

  useEffect(() => {
    const loadUserPockets = async () => {
      if (!userProfile?.pocketIds || userProfile.pocketIds.length === 0) {
        setUserPockets([]);
        setLoadingPockets(false);
        return;
      }
      setLoadingPockets(true);
      try {
        const pockets = await Promise.all(userProfile.pocketIds.map(id => getPocket(id)));
        const validPockets = pockets.filter((p): p is Pocket => p !== null && !p.deleted);
        setUserPockets(validPockets);
        if (validPockets.length > 0 && !isModal) setMode('manage');
      } catch (err) {
        logger.error('Error loading user pockets', { error: err });
        setUserPockets([]);
      } finally {
        setLoadingPockets(false);
      }
    };
    loadUserPockets();
  }, [userProfile?.pocketIds, userProfile?.currentPocketId, isModal]);

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

  const handleCreatePocket = useCallback(async (name: string, role: UserRole) => {
    if (!user || !userProfile) return;
    setLoading(true);
    setError('');
    try {
      const pocket = await createPocket(name.trim(), user.uid, role);
      await addPocketToUser(user.uid, pocket.id);
      const updatedPocketIds = [...(userProfile.pocketIds || []), pocket.id];
      setUserProfile({ ...userProfile, currentPocketId: pocket.id, pocketIds: updatedPocketIds });
      setCurrentPocket(pocket);
      if (onSuccess) onSuccess();
      else router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pocket');
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, setUserProfile, setCurrentPocket, locale, router, onSuccess]);

  const handleJoinPocket = useCallback(async (code: string, role: UserRole) => {
    if (!user || !userProfile) return;
    setLoading(true);
    setError('');
    try {
      const pocket = await joinPocket(code, user.uid, role);
      if (!pocket) throw new Error('Unable to join pocket right now.');
      await addPocketToUser(user.uid, pocket.id);
      const updatedPocketIds = [...(userProfile.pocketIds || []), pocket.id];
      setUserProfile({ ...userProfile, currentPocketId: pocket.id, pocketIds: updatedPocketIds });
      setCurrentPocket(pocket);
      if (onSuccess) onSuccess();
      else router.push(`/${locale}/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, setUserProfile, setCurrentPocket, locale, router, onSuccess]);

  const handleSelectPocket = useCallback(async (pocket: Pocket) => {
    if (!user || !userProfile) return;
    setLoading(true);
    try {
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setUserProfile({ ...updatedProfile, currentPocketId: pocket.id });
        setCurrentPocket(pocket);
        if (onSuccess) onSuccess();
        else router.push(`/${locale}/dashboard`);
      }
    } catch (err) {
      logger.error('Error selecting pocket', { error: err });
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, setUserProfile, setCurrentPocket, locale, router, onSuccess]);

  const handleDeletePocket = useCallback(async () => {
    if (!confirmDeletePocket || !user) return;
    setDeletingPocketId(confirmDeletePocket.id);
    try {
      await deletePocket(confirmDeletePocket.id, user.uid);
      await removePocketFromUser(user.uid, confirmDeletePocket.id);
      const updatedPockets = userPockets.filter(p => p.id !== confirmDeletePocket.id);
      setUserPockets(updatedPockets);
      if (userProfile) {
        const updatedPocketIds = userProfile.pocketIds?.filter(id => id !== confirmDeletePocket.id) || [];
        const newCurrentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
        setUserProfile({ ...userProfile, pocketIds: updatedPocketIds, currentPocketId: newCurrentPocketId });
      }
      setConfirmDeletePocket(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setDeletingPocketId(null);
    }
  }, [confirmDeletePocket, user, userPockets, userProfile, setUserProfile, t]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (err) {
      logger.error('Error signing out', { error: err });
    }
  }, [locale, router]);

  const userName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || '';

  if (isModal) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div className="tab-toggle">
          <button onClick={() => setMode('create')} disabled={loading} className={`tt-btn ${mode === 'create' ? 'active' : ''}`}>
            <Plus size={14} /> Create New
          </button>
          <button onClick={() => setMode('join')} disabled={loading} className={`tt-btn ${mode === 'join' ? 'active' : ''}`}>
            <UserPlus size={14} /> Join Existing
          </button>
        </div>
        {mode === 'create'
          ? <CreatePocketForm onSubmit={handleCreatePocket} isSubmitting={loading} error={error} />
          : <JoinPocketForm onSubmit={handleJoinPocket} isSubmitting={loading} error={error} />
        }
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="dot-grid" />

      {/* Nav */}
      <nav className="nav">
        <button type="button" className="nav-logo" onClick={() => router.push(`/${locale}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <div className="nav-mark"><LogoMark /></div>
          <span className="nav-name">{tNav('pairbudget')}</span>
        </button>
        <div className="nav-spacer" />
        <div className="nav-right">
          <span className="nav-user">Signed in as <strong>{userName}</strong></span>
          <LanguageSelector />
          {userPockets.length > 0 && (
            <button onClick={() => router.push(`/${locale}/dashboard`)} className="btn btn-ghost btn-sm">
              <Home size={14} />
              <span>{t('backToDashboard')}</span>
            </button>
          )}
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            {tCommon('signOut')}
          </button>
        </div>
      </nav>

      {/* Body */}
      {loadingPockets ? (
        <div className="setup-wrap" style={{ textAlign: 'center' }}>
          <LoadingSpinner size="lg" className="mb-4" />
          <p style={{ color: 'var(--text-muted)' }}>{tCommon('loading')}</p>
        </div>
      ) : userPockets.length === 0 ? (
        // First-time setup
        <div className="setup-wrap">
          <div className="step-bar">
            <div className="step-dot done" /><div className="step-line done" />
            <div className="step-dot done" /><div className="step-line" />
            <div className="step-dot" />
          </div>
          <span className="setup-kicker">Step 2 of 3 — Your Pocket</span>
          <h1 className="setup-h">Setup Your Pocket</h1>
          <p className="setup-sub">Create a new shared budget or join your partner&apos;s pocket.</p>

          <div className="tab-toggle">
            <button onClick={() => setMode('create')} disabled={loading} className={`tt-btn ${mode === 'create' ? 'active' : ''}`}>
              <Plus size={14} /> Create New
            </button>
            <button onClick={() => setMode('join')} disabled={loading} className={`tt-btn ${mode === 'join' ? 'active' : ''}`}>
              <UserPlus size={14} /> Join Existing
            </button>
          </div>

          {mode === 'create'
            ? <CreatePocketForm onSubmit={handleCreatePocket} isSubmitting={loading} error={error} />
            : <JoinPocketForm onSubmit={handleJoinPocket} isSubmitting={loading} error={error} />
          }
        </div>
      ) : (
        // Manage existing pockets
        <div className="pockets-inner">
          <div className="page-top-row">
            <div>
              <span className="pt-eye">My Pockets</span>
              <div className="pt-title">{t('managePockets')}</div>
              <div className="pt-sub">{userPockets.length} active pocket{userPockets.length === 1 ? '' : 's'} · Select one to open dashboard</div>
            </div>
            <button onClick={() => setMode('create')} className="btn btn-primary">
              <Plus size={15} /> New Pocket
            </button>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          {mode === 'create' && (
            <div className="card card-padded" style={{ marginBottom: '1.5rem', maxWidth: 560 }}>
              <CreatePocketForm
                onSubmit={handleCreatePocket}
                isSubmitting={loading}
                error={error}
                onCancel={() => setMode('manage')}
              />
            </div>
          )}

          {mode === 'join' && (
            <div className="card card-padded" style={{ marginBottom: '1.5rem', maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 className="t-head" style={{ fontSize: '1.1rem' }}>Join Existing</h3>
                <button type="button" onClick={() => setMode('manage')} className="modal-close" aria-label="Close">
                  <ChevronRight size={16} />
                </button>
              </div>
              <JoinPocketForm onSubmit={handleJoinPocket} isSubmitting={loading} error={error} />
            </div>
          )}

          <PocketList
            pockets={userPockets}
            onSelect={handleSelectPocket}
            onDelete={setConfirmDeletePocket}
            onCreate={() => setMode('create')}
            locale={locale}
            preferredCurrency={userProfile?.preferredCurrency}
            isLoading={loading}
          />
        </div>
      )}

      <DeletePocketModal
        pocket={confirmDeletePocket}
        onConfirm={handleDeletePocket}
        onClose={() => setConfirmDeletePocket(null)}
        isDeleting={deletingPocketId !== null}
      />
    </div>
  );
};

export default PocketSetup;
