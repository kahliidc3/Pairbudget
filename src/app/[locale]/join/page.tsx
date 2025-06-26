'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { joinPocket } from '@/services/pocketService';
import { updateUserProfile } from '@/services/authService';
import { usePocketStore } from '@/store/pocketStore';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UserRole } from '@/types';
import {
  Wallet,
  CreditCard,
  ArrowLeft,
  Check,
  AlertCircle,
  Heart,
  Sparkles,
  UserPlus,
  Shield
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    if (!user) {
      router.push(`/${locale}`);
    }
  }, [user, router, locale]);

  const handleJoin = async () => {
    if (!user || !userProfile || !inviteCode) return;

    setLoading(true);
    setError('');

    try {
      const pocket = await joinPocket(inviteCode, user.uid, selectedRole);
      
      // Update user profile with pocket ID
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      setCurrentPocket(pocket);
      
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400 relative overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full" style={{
            animation: 'float 20s ease-in-out infinite'
          }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full" style={{
            animation: 'float 25s ease-in-out infinite reverse'
          }}></div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-xl relative z-10">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(5deg); }
            50% { transform: translateY(-10px) rotate(0deg); }
            75% { transform: translateY(-30px) rotate(-5deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full" style={{
            animation: 'float 20s ease-in-out infinite'
          }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full" style={{
            animation: 'float 25s ease-in-out infinite reverse'
          }}></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full" style={{
            animation: 'float 15s ease-in-out infinite'
          }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full text-center relative z-10 shadow-xl"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Invite Link</h2>
          <p className="text-gray-600 mb-8">
            This invite link is not valid or has expired. Please ask your partner to send you a new invite link.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl px-6 py-3 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </motion.button>
        </motion.div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(5deg); }
            50% { transform: translateY(-10px) rotate(0deg); }
            75% { transform: translateY(-30px) rotate(-5deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full" style={{
          animation: 'float 20s ease-in-out infinite'
        }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full" style={{
          animation: 'float 25s ease-in-out infinite reverse'
        }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full" style={{
          animation: 'float 15s ease-in-out infinite'
        }}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-full" style={{
          animation: 'float 18s ease-in-out infinite reverse'
        }}></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-500/20 rounded-full" style={{
          animation: 'float 22s ease-in-out infinite'
        }}></div>
        <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full" style={{
          animation: 'float 30s ease-in-out infinite reverse'
        }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-br from-indigo-600/20 to-purple-500/20 rounded-full" style={{
          animation: 'float 12s ease-in-out infinite'
        }}></div>
        <div className="absolute top-10 right-1/2 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full" style={{
          animation: 'float 16s ease-in-out infinite reverse'
        }}></div>

        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-20 w-16 h-16 bg-gradient-to-br from-blue-500/15 to-purple-600/15 transform rotate-45" style={{
          animation: 'float 20s ease-in-out infinite, spin 40s linear infinite'
        }}></div>
        <div className="absolute bottom-1/4 right-16 w-12 h-12 bg-gradient-to-br from-purple-500/15 to-indigo-600/15 rounded-lg transform rotate-12" style={{
          animation: 'float 25s ease-in-out infinite reverse, spin 35s linear infinite reverse'
        }}></div>
        <div className="absolute top-2/3 left-1/4 w-14 h-14 bg-gradient-to-br from-indigo-500/15 to-blue-600/15 rounded-full transform" style={{
          animation: 'float 18s ease-in-out infinite'
        }}></div>
        <div className="absolute bottom-40 right-1/4 w-18 h-18 bg-gradient-to-br from-cyan-500/15 to-purple-600/15 rounded-xl transform rotate-45" style={{
          animation: 'float 22s ease-in-out infinite reverse'
        }}></div>
        <div className="absolute top-1/2 right-20 w-10 h-10 bg-gradient-to-br from-purple-600/15 to-pink-500/15 rounded-lg transform rotate-12" style={{
          animation: 'float 15s ease-in-out infinite'
        }}></div>
        <div className="absolute bottom-1/2 left-16 w-20 h-8 bg-gradient-to-br from-blue-600/15 to-indigo-500/15 rounded-full transform rotate-45" style={{
          animation: 'float 28s ease-in-out infinite reverse'
        }}></div>

        {/* Accent Glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl mb-6 relative">
              <UserPlus className="w-10 h-10 text-white" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Join the Pocket
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              You&apos;ve been invited to join a shared expense pocket
            </p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Secure Invitation</span>
            </div>
          </motion.div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-10"
          >
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-semibold mb-2">Choose Your Role</h3>
              <p className="text-gray-600">Select how you&apos;ll participate in this shared pocket</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider Role */}
              <motion.label
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer block group"
              >
                  <input
                    type="radio"
                    name="role"
                    value="provider"
                    checked={selectedRole === 'provider'}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="sr-only"
                />
                <div className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                  selectedRole === 'provider'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg shadow-blue-200/50'
                    : 'border-gray-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/30'
                }`}>
                  {selectedRole === 'provider' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                      selectedRole === 'provider' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100'
                    }`}>
                      <Wallet className={`w-8 h-8 transition-colors duration-300 ${
                        selectedRole === 'provider' ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                      }`} />
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Provider</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      I will fund the pocket and manage the budget. Perfect for the person 
                      who handles financial planning and transfers.
                    </p>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">Budget Manager</span>
                    </div>
                  </div>
                </div>
              </motion.label>

              {/* Spender Role */}
              <motion.label
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer block group"
              >
                  <input
                    type="radio"
                    name="role"
                    value="spender"
                    checked={selectedRole === 'spender'}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="sr-only"
                />
                <div className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                  selectedRole === 'spender'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-200/50'
                    : 'border-gray-200 bg-white/50 hover:border-purple-300 hover:bg-purple-50/30'
                }`}>
                  {selectedRole === 'spender' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-4 right-4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                      selectedRole === 'spender' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-purple-100 group-hover:to-pink-100'
                    }`}>
                      <CreditCard className={`w-8 h-8 transition-colors duration-300 ${
                        selectedRole === 'spender' ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'
                      }`} />
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Spender</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      I will make purchases and log expenses. Perfect for the person 
                      who handles day-to-day shopping and transactions.
                    </p>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600">Expense Tracker</span>
                    </div>
                  </div>
              </div>
              </motion.label>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="flex items-center justify-center space-x-2 flex-1 bg-white/10 backdrop-blur-sm text-gray-700 rounded-xl px-6 py-3 hover:bg-white/20 transition-all border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <button
                onClick={handleJoin}
              disabled={loading}
              className="flex items-center justify-center space-x-2 flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl px-6 py-3 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Join Pocket</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Invite Code Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Invite Code</p>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                <code className="text-lg font-mono font-bold text-purple-600 tracking-wider">
                  {inviteCode}
                </code>
              </div>
            </div>
          </motion.div>
          </div>
      </motion.div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
          75% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-xl">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-300">Loading...</p>
          </div>
      </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
} 