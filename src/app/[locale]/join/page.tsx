'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { logger } from '@/lib/logger';
import { joinPocket, getPocket } from '@/services/pocketService';
import { updateUserProfile } from '@/services/authService';
import { usePocketStore } from '@/store/pocketStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UserRole, Pocket } from '@/types';
import LanguageSelector from '@/components/LanguageSelector';
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  Check,
  AlertCircle,
  Heart,
  Sparkles,
  UserPlus,
  Shield,
  Users,
  DollarSign
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function JoinPageContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('spender');
  const [loadingPockets, setLoadingPockets] = useState(true);
  const [userPockets, setUserPockets] = useState<Pocket[]>([]);
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  
  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (!user) {
      router.push(`/${locale}`);
    }
  }, [user, router, locale]);

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
      } catch (error) {
        logger.error('Error loading user pockets', { error });
        setUserPockets([]);
      } finally {
        setLoadingPockets(false);
      }
    };

    if (userProfile) {
      loadUserPockets();
    }
  }, [userProfile?.pocketIds, userProfile]);

  const handleJoin = async () => {
    if (!user || !userProfile || !inviteCode) return;

    setLoading(true);
    setError('');

    try {
      const pocket = await joinPocket(inviteCode, user.uid, selectedRole);
      
      // Update user profile with pocket ID
      const updatedPocketIds = [...(userProfile.pocketIds || []), pocket.id];
      await updateUserProfile(user.uid, { 
        currentPocketId: pocket.id,
        pocketIds: updatedPocketIds
      });
      setUserProfile({ 
        ...userProfile, 
        currentPocketId: pocket.id,
        pocketIds: updatedPocketIds
      });
      setCurrentPocket(pocket);
      
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingPocket = async (pocket: Pocket) => {
    if (!user || !userProfile) return;

    try {
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      setCurrentPocket(pocket);
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      logger.error('Error selecting pocket', { error });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-xl">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-white/70 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!inviteCode) {
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
        </div>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-4"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-white text-lg">PairBudget</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center text-sm text-white/80 font-medium mr-2">
                  Welcome, {userProfile?.name || user?.displayName || user?.email?.split('@')[0]}
                </div>
                <LanguageSelector />
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </motion.nav>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
          >
            <div className="w-20 h-20 bg-red-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Invite Link</h2>
            <p className="text-white/70 mb-8">
              This invite link is not valid or has expired. Please ask your partner to send you a new invite link.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl font-medium flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

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
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-white text-lg">PairBudget</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="min-h-screen flex items-center justify-center p-4 py-24 relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-8 items-start"
          >
            {/* Join Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Join Shared Pocket</h1>
                <p className="text-white/70">Choose your role to get started with collaborative budgeting</p>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Role Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Your Role</h3>
                  <div className="space-y-3">
                    {/* Provider Role */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedRole('provider')}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedRole === 'provider'
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedRole === 'provider' ? 'bg-blue-500/30' : 'bg-white/10'
                        }`}>
                          <Wallet className={`w-5 h-5 ${
                            selectedRole === 'provider' ? 'text-blue-300' : 'text-white/70'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-white">Provider</h4>
                            {selectedRole === 'provider' && (
                              <Check className="w-4 h-4 text-blue-300" />
                            )}
                          </div>
                          <p className="text-sm text-white/70">Add funds and track expenses</p>
                        </div>
                      </div>
                    </motion.button>

                    {/* Spender Role */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedRole('spender')}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedRole === 'spender'
                          ? 'border-green-400 bg-green-500/20'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedRole === 'spender' ? 'bg-green-500/30' : 'bg-white/10'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${
                            selectedRole === 'spender' ? 'text-green-300' : 'text-white/70'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-white">Spender</h4>
                            {selectedRole === 'spender' && (
                              <Check className="w-4 h-4 text-green-300" />
                            )}
                          </div>
                          <p className="text-sm text-white/70">Track expenses and add funds</p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="mb-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>What you&apos;ll get access to:</span>
                  </h4>
                  <div className="space-y-2 text-sm text-white/70">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Real-time collaboration with your partner</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span>Shared expense tracking and budgeting</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span>Secure and private financial data</span>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl px-6 py-3 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl font-medium flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Joining Pocket...</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        <span>Join Shared Pocket</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Existing Pockets */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Existing Pockets</h2>
                <p className="text-white/70">Or continue with one of your existing shared budgets</p>
              </div>

              <div className="p-8">
                {loadingPockets ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <p className="text-white/70">Loading your pockets...</p>
                  </div>
                ) : userPockets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-white/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Existing Pockets</h3>
                    <p className="text-white/60">This will be your first shared budget pocket</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPockets.map((pocket, index) => (
                      <motion.button
                        key={pocket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => handleSelectExistingPocket(pocket)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 text-left transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{pocket.name}</h3>
                              <p className="text-sm text-white/60">{pocket.participants.length} members</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${pocket.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(pocket.balance)}
                            </p>
                            <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors rotate-180" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-white/50">
                          <span>Funded: {formatCurrency(pocket.totalFunded)}</span>
                          <span>•</span>
                          <span>Spent: {formatCurrency(pocket.totalSpent)}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-xl">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-white/70 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  );
} 
