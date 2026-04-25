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
import { AlertCircle, Home, Plus, UserPlus, Wallet } from 'lucide-react';

interface PocketSetupProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

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

  const handleBackToDashboard = useCallback(() => {
    if (userPockets.length > 0) router.push(`/${locale}/dashboard`);
  }, [userPockets.length, locale, router]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (err) {
      logger.error('Error signing out', { error: err });
    }
  }, [locale, router]);

  if (isModal) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-100 rounded-lg p-1 mb-6">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setMode('create')}
                disabled={loading}
                className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                  mode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={loading}
                className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                  mode === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Existing</span>
              </button>
            </div>
          </div>
          {mode === 'create' ? (
            <CreatePocketForm onSubmit={handleCreatePocket} isSubmitting={loading} error={error} />
          ) : (
            <JoinPocketForm onSubmit={handleJoinPocket} isSubmitting={loading} error={error} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-800">
      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-emerald-500/20 rounded-full blur-lg" />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-emerald-600/20 rounded-full blur-md" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-2 sm:mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-4 shadow-xl mobile-nav">
          <div className="flex items-center justify-between nav-content">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-bold text-white text-sm sm:text-lg nav-logo truncate">{tNav('pairbudget')}</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4 nav-actions">
              <div className="hidden lg:flex items-center text-sm text-white/80 font-medium mr-2">
                Welcome, {userProfile?.name || user?.displayName || user?.email?.split('@')[0]}
              </div>
              <LanguageSelector />
              {userPockets.length > 0 && (
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium min-w-[40px] min-h-[40px] justify-center mobile-btn"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('backToDashboard')}</span>
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium min-w-[40px] min-h-[40px] mobile-btn"
                aria-label={tCommon('signOut')}
              >
                <span className="hidden sm:inline">{tCommon('signOut')}</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-16 sm:py-24 relative z-10 mobile-content">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 mobile-title">
              {userPockets.length === 0 ? t('title') : t('managePockets')}
            </h1>
            <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto mobile-subtitle">
              {userPockets.length === 0 ? t('subtitle') : t('manageSubtitle')}
            </p>
          </div>

          <div className="text-center mb-8 sm:mb-12">
            <button
              onClick={() => setMode('manage')}
              disabled={loading}
              className="inline-flex items-center space-x-2 sm:space-x-3 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl sm:rounded-2xl hover:from-cyan-700 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl text-sm sm:text-lg font-semibold mobile-btn-lg"
            >
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Manage My Pockets</span>
              <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
                {userPockets.length}
              </span>
            </button>
            <p className="text-white/80 mt-2 sm:mt-3 text-xs sm:text-sm">
              View, select, and manage all your existing budget pockets
            </p>
          </div>

          {loadingPockets ? (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-white/90">{tCommon('loading')}</p>
            </div>
          ) : userPockets.length === 0 ? (
            /* No pockets — create or join */
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
              <div className="bg-white/10 rounded-lg p-1 mb-8">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setMode('create')}
                    disabled={loading}
                    className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                      mode === 'create' ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New</span>
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    disabled={loading}
                    className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                      mode === 'join' ? 'bg-white/20 text-white shadow-sm' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('joinExisting')}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-200">{error}</span>
                </div>
              )}

              {mode === 'create' ? (
                <CreatePocketForm onSubmit={handleCreatePocket} isSubmitting={loading} />
              ) : (
                <JoinPocketForm onSubmit={handleJoinPocket} isSubmitting={loading} />
              )}
            </div>
          ) : (
            /* Has pockets — management view */
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={() => setMode('create')}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Pocket</span>
                </button>
              </div>

              <PocketList
                pockets={userPockets}
                onSelect={handleSelectPocket}
                onDelete={setConfirmDeletePocket}
                locale={locale}
                preferredCurrency={userProfile?.preferredCurrency}
                isLoading={loading}
              />

              {mode === 'create' && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
                  {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-200">{error}</span>
                    </div>
                  )}
                  <CreatePocketForm
                    onSubmit={handleCreatePocket}
                    isSubmitting={loading}
                    onCancel={() => setMode('manage')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
