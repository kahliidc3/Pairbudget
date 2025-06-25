'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
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
  
  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

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
      
      router.push('/dashboard');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card animate-scale-in text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="bg-particles">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="geometric-blob"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-floating max-w-md w-full text-center relative z-10"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
            </div>
          
          <h2 className="text-title mb-4">Invalid Invite Link</h2>
          <p className="text-gray-600 mb-8">
            This invite link is not valid or has expired. Please ask your partner to send you a new invite link.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="bg-particles">
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="geometric-blob"></div>
        <div className="geometric-blob"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Main Card */}
        <div className="card-floating">
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
            
            <h1 className="text-hero mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
              <h3 className="text-title mb-2">Choose Your Role</h3>
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
              onClick={() => router.push('/dashboard')}
              className="btn-ghost flex items-center justify-center space-x-2 flex-1"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <button
                onClick={handleJoin}
              disabled={loading}
              className="btn-primary flex items-center justify-center space-x-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card animate-scale-in text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
      </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
} 