'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { logger } from '@/lib/logger';
import { createPocket, joinPocket, deletePocket, getPocket } from '@/services/pocketService';
import { addPocketToUser, removePocketFromUser, getUserProfile, signOut } from '@/services/authService';
import { UserRole, Pocket } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import LanguageSelector from '@/components/LanguageSelector';
import {
  Wallet,
  CreditCard,
  Plus,
  UserPlus,
  AlertCircle,
  Trash2,
  Users,
  Calendar,
  Home,
  X,
  AlertTriangle
} from 'lucide-react';

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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    inviteCode: '',
    role: 'provider' as UserRole
  });
  
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();

  const hasPockets = userPockets.length > 0;
  const headerTitle = hasPockets ? t('managePockets') : t('title');
  const headerSubtitle = hasPockets ? t('manageSubtitle') : t('subtitle');
  const displayName = userProfile?.name || user?.displayName || user?.email?.split('@')[0];

  // Load user's existing pockets
  useEffect(() => {
    const loadUserPockets = async () => {
      if (!userProfile?.pocketIds || userProfile.pocketIds.length === 0) {
        setUserPockets([]);
        setLoadingPockets(false);
        return;
      }

      setLoadingPockets(true);
      try {
        const pockets = await Promise.all(
          userProfile.pocketIds.map(async (pocketId) => {
            const pocket = await getPocket(pocketId);
            return pocket;
          })
        );
        
        // Filter out null values and deleted pockets
        const validPockets = pockets.filter((pocket): pocket is Pocket => 
          pocket !== null && !pocket.deleted
        );
        setUserPockets(validPockets);
        
        // If user has pockets but no current pocket is set, show management view
        if (validPockets.length > 0 && !isModal) {
          setMode('manage');
        }
      } catch (error) {
        logger.error('Error loading user pockets', { error });
        setUserPockets([]);
      } finally {
        setLoadingPockets(false);
      }
    };

    loadUserPockets();
  }, [userProfile?.pocketIds, userProfile?.currentPocketId, isModal]);

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setLoading(true);
    setError('');

    try {
      const pocket = await createPocket(formData.name, user.uid, formData.role);
      
      // Add pocket to user's pocket list and set as current
      await addPocketToUser(user.uid, pocket.id);
      const updatedPocketIds = [...(userProfile.pocketIds || []), pocket.id];
      setUserProfile({ 
        ...userProfile, 
        currentPocketId: pocket.id,
        pocketIds: updatedPocketIds
      });
      setCurrentPocket(pocket);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to create pocket');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setLoading(true);
    setError('');

    try {
      const pocket = await joinPocket(formData.inviteCode, user.uid, formData.role);
      
      // Add pocket to user's pocket list and set as current
      await addPocketToUser(user.uid, pocket.id);
      const updatedPocketIds = [...(userProfile.pocketIds || []), pocket.id];
      setUserProfile({ 
        ...userProfile, 
        currentPocketId: pocket.id,
        pocketIds: updatedPocketIds
      });
      setCurrentPocket(pocket);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPocket = async (pocket: Pocket) => {
    if (!user || !userProfile) return;

    try {
      // Update user's current pocket
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setUserProfile({ ...updatedProfile, currentPocketId: pocket.id });
        setCurrentPocket(pocket);
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/${locale}/dashboard`);
        }
      }
    } catch (error) {
      logger.error('Error selecting pocket', { error });
    }
  };

  const handleDeletePocket = async () => {
    if (!confirmDeletePocket || !user || deleteConfirmText !== 'DELETE') return;

    setDeletingPocketId(confirmDeletePocket.id);
    try {
      await deletePocket(confirmDeletePocket.id, user.uid);
      
      // Remove from user's pocket list
      await removePocketFromUser(user.uid, confirmDeletePocket.id);
      
      // Update local state
      const updatedPockets = userPockets.filter(p => p.id !== confirmDeletePocket.id);
      setUserPockets(updatedPockets);
      
      // Update user profile
      if (userProfile) {
        const updatedPocketIds = userProfile.pocketIds?.filter(id => id !== confirmDeletePocket.id) || [];
        const newCurrentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
        
        setUserProfile({
          ...userProfile,
          pocketIds: updatedPocketIds,
          currentPocketId: newCurrentPocketId
        });
      }
      
      setConfirmDeletePocket(null);
      setDeleteConfirmText('');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('deleteError'));
    } finally {
      setDeletingPocketId(null);
    }
  };

  const handleBackToDashboard = () => {
    if (userPockets.length > 0) {
      router.push(`/${locale}/dashboard`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      logger.error('Error signing out', { error });
    }
  };

  if (isModal) {
    // Keep the existing modal version for backwards compatibility
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          {/* Mode Toggle */}
          <div className="bg-slate-100 rounded-lg p-1 mb-6">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setMode('create')}
                className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                  mode === 'create'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </button>
              <button
                onClick={() => setMode('join')}
                className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                  mode === 'join'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Join Existing</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {mode === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Create Your Pocket</h3>
                  <p className="text-sm text-slate-600">Set up a new shared expense pocket</p>
                </div>
                {/* Rest of the form */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Full page version with all the new features
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"
          animate={{ 
            y: [0, -20, 0], 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-lg"
          animate={{ 
            y: [0, 15, 0], 
            x: [0, 10, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-md"
          animate={{ 
            y: [0, -25, 0], 
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-2 sm:mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-4 shadow-xl mobile-nav">
          <div className="flex items-center justify-between nav-content">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
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
              >
                <span className="hidden sm:inline">{tCommon('signOut')}</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-16 sm:py-24 relative z-10 mobile-content">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 mobile-title">
              {userPockets.length === 0 ? t('title') : t('managePockets')}
            </h1>
            <p className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto mobile-subtitle">
              {userPockets.length === 0 ? t('subtitle') : t('manageSubtitle')}
            </p>
          </motion.div>

          {/* Manage Pockets Button - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8 sm:mb-12"
          >
            <button
              onClick={() => setMode('manage')}
              className="inline-flex items-center space-x-2 sm:space-x-3 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl sm:rounded-2xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-sm sm:text-lg font-semibold mobile-btn-lg"
            >
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Manage My Pockets</span>
              <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
                {userPockets.length}
              </span>
            </button>
            <p className="text-white/60 mt-2 sm:mt-3 text-xs sm:text-sm">
              View, select, and manage all your existing budget pockets
            </p>
          </motion.div>

          {loadingPockets ? (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-white/70">{tCommon('loading')}</p>
            </div>
          ) : userPockets.length === 0 ? (
            /* No Pockets - Show Create/Join Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto"
            >
              {/* Mode Toggle */}
              <div className="bg-white/10 rounded-lg p-1 mb-8">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setMode('create')}
                    className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                      mode === 'create'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New</span>
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                      mode === 'join'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
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

              <AnimatePresence mode="wait">
                {mode === 'create' ? (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Create Your Pocket</h3>
                      <p className="text-white/70">Set up a new shared expense pocket</p>
                    </div>

                    <form onSubmit={handleCreatePocket} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-3">
                          Pocket Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Family Budget, Trip Fund"
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors backdrop-blur-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-4">
                          Your Role
                        </label>
                        <div className="space-y-3">
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              value="provider"
                              checked={formData.role === 'provider'}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                              className="sr-only"
                            />
                            <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              formData.role === 'provider'
                                ? 'border-blue-500 bg-blue-500/20'
                                : 'border-white/20 hover:border-white/30 bg-white/5'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'provider' ? 'bg-blue-600' : 'bg-white/20'
                                }`}>
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">Provider</div>
                                  <div className="text-sm text-white/70">Fund the pocket and manage budget</div>
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              value="spender"
                              checked={formData.role === 'spender'}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                              className="sr-only"
                            />
                            <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              formData.role === 'spender'
                                ? 'border-blue-500 bg-blue-500/20'
                                : 'border-white/20 hover:border-white/30 bg-white/5'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'spender' ? 'bg-blue-600' : 'bg-white/20'
                                }`}>
                                  <Wallet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">Spender</div>
                                  <div className="text-sm text-white/70">Make purchases and log expenses</div>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>Create Pocket</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{t('joinExisting')}</h3>
                      <p className="text-white/70">{t('enterInviteCode')}</p>
                    </div>

                    <form onSubmit={handleJoinPocket} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-3">
                          {t('inviteCode')}
                        </label>
                        <input
                          type="text"
                          value={formData.inviteCode}
                          onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                          placeholder="ABC123"
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors backdrop-blur-sm text-center text-lg font-mono tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-4">
                          Your Role
                        </label>
                        <div className="space-y-3">
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              value="provider"
                              checked={formData.role === 'provider'}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                              className="sr-only"
                            />
                            <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              formData.role === 'provider'
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/20 hover:border-white/30 bg-white/5'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'provider' ? 'bg-purple-600' : 'bg-white/20'
                                }`}>
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">Provider</div>
                                  <div className="text-sm text-white/70">Fund the pocket and manage budget</div>
                                </div>
                              </div>
                            </div>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              value="spender"
                              checked={formData.role === 'spender'}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                              className="sr-only"
                            />
                            <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              formData.role === 'spender'
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/20 hover:border-white/30 bg-white/5'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'spender' ? 'bg-purple-600' : 'bg-white/20'
                                }`}>
                                  <Wallet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">Spender</div>
                                  <div className="text-sm text-white/70">Make purchases and log expenses</div>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5" />
                            <span>Join Pocket</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Existing Pockets - Show Management View */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Create New Pocket Button */}
              <div className="text-center">
                <button
                  onClick={() => setMode('create')}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Pocket</span>
                </button>
              </div>

              {/* Existing Pockets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPockets.map((pocket, index) => (
                  <motion.div
                    key={pocket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <button
                        onClick={() => setConfirmDeletePocket(pocket)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 truncate">{pocket.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Balance</span>
                        <span className={`font-medium ${pocket.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(pocket.balance)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Members</span>
                        </span>
                        <span className="text-white font-medium">{pocket.participants.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created</span>
                        </span>
                        <span className="text-white/70 text-sm">{formatDate(pocket.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPocket(pocket)}
                      className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 hover:border-white/30 font-medium"
                    >
                      Select Pocket
                    </button>
                  </motion.div>
                ))}
              </div>

              {mode === 'create' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Create New Pocket</h3>
                    <button
                      onClick={() => setMode('manage')}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-200">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreatePocket} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-3">
                        Pocket Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Family Budget, Trip Fund"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-4">
                        Your Role
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            value="provider"
                            checked={formData.role === 'provider'}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                            formData.role === 'provider'
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-white/20 hover:border-white/30 bg-white/5'
                          }`}>
                            <CreditCard className="w-8 h-8 text-white mx-auto mb-2" />
                            <div className="font-medium text-white">Provider</div>
                            <div className="text-xs text-white/70 mt-1">Fund & manage budget</div>
                          </div>
                        </label>

                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            value="spender"
                            checked={formData.role === 'spender'}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            className="sr-only"
                          />
                          <div className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                            formData.role === 'spender'
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-white/20 hover:border-white/30 bg-white/5'
                          }`}>
                            <Wallet className="w-8 h-8 text-white mx-auto mb-2" />
                            <div className="font-medium text-white">Spender</div>
                            <div className="text-xs text-white/70 mt-1">Make purchases & log expenses</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>Create Pocket</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeletePocket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('deletePocketConfirm')}</h3>
                <p className="text-white/70 mb-4">{t('deletePocketWarning')}</p>
                <p className="text-sm text-white/50">{t('deleteConfirmText')}</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors backdrop-blur-sm text-center font-mono"
                />

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setConfirmDeletePocket(null);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 hover:border-white/30 font-medium"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    onClick={handleDeletePocket}
                    disabled={deleteConfirmText !== 'DELETE' || deletingPocketId === confirmDeletePocket.id}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {deletingPocketId === confirmDeletePocket.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>{t('deletePocket')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PocketSetup; 
