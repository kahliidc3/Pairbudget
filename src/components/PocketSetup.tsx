'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { createPocket, joinPocket } from '@/services/pocketService';
import { addPocketToUser } from '@/services/authService';
import { UserRole } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Wallet,
  CreditCard,
  Plus,
  UserPlus,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface PocketSetupProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

const PocketSetup: React.FC<PocketSetupProps> = ({ onSuccess, isModal = false }) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    inviteCode: '',
    role: 'provider' as UserRole
  });
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();

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
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
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
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to join pocket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? "p-6" : "min-h-screen bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400 relative overflow-hidden"}>
      {!isModal && (
        <>
          {/* Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Animated Floating Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r ${
                  i % 3 === 0 ? 'from-blue-500/20 to-indigo-600/20' :
                  i % 3 === 1 ? 'from-indigo-500/20 to-purple-600/20' :
                  'from-purple-500/20 to-blue-600/20'
                } blur-sm`}
                style={{
                  left: `${10 + (i * 15)}%`,
                  top: `${20 + (i * 12)}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, i % 2 === 0 ? 15 : -15, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 6 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Content */}
      <div className={isModal ? "" : "relative z-10 min-h-screen p-6 md:p-6 lg:p-8"}>
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl mb-6 relative">
              <Wallet className="w-10 h-10 text-white" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className={`text-3xl md:text-3xl font-bold mb-4 ${isModal ? 'text-gray-900' : 'text-white'}`}>
              Welcome to PairBudget
            </h1>
            <p className={`text-lg max-w-xl mx-auto leading-relaxed ${isModal ? 'text-gray-600' : 'text-gray-300'}`}>
              Create a new shared pocket or join an existing one to start tracking expenses together.
            </p>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={isModal ? "bg-gray-100 border border-gray-200 rounded-2xl p-4 mb-8" : "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 mb-8"}
          >
                          <div className={`flex p-2 rounded-xl ${isModal ? 'bg-gray-200' : 'bg-white/10'}`}>
              <button
                onClick={() => setMode('create')}
                className={`flex-1 py-4 px-4 text-base font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  mode === 'create'
                    ? isModal ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/20 text-white shadow-lg backdrop-blur-lg border border-white/30'
                    : isModal ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-300' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Create New Pocket</span>
              </button>
              <button
                onClick={() => setMode('join')}
                className={`flex-1 py-4 px-4 text-base font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  mode === 'join'
                    ? isModal ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/20 text-white shadow-lg backdrop-blur-lg border border-white/30'
                    : isModal ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-300' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                <span>Join Existing Pocket</span>
              </button>
            </div>
          </motion.div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {mode === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Create Your Pocket</h2>
                    <p className="text-gray-300 text-base">Set up a new shared expense pocket</p>
                  </div>
                </div>

                <form onSubmit={handleCreatePocket} className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-white mb-3">
                      Pocket Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Family Budget, Weekend Getaway"
                      required
                      className="w-full px-4 py-4 text-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white mb-4">
                      Your Role
                    </label>
                    <div className="space-y-2">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          value="provider"
                          checked={formData.role === 'provider'}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-lg ${
                          formData.role === 'provider'
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/30 bg-white/5'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              formData.role === 'provider' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                              <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-white">Provider</div>
                              <div className="text-sm text-gray-300">I will fund the pocket and manage the budget</div>
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
                        <div className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-lg ${
                          formData.role === 'spender'
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-white/20 hover:border-white/30 bg-white/5'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              formData.role === 'spender' ? 'bg-green-500' : 'bg-gray-500'
                            }`}>
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-white">Spender</div>
                              <div className="text-sm text-gray-300">I will make purchases and log expenses</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center space-x-2 backdrop-blur-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !formData.name.trim()}
                    className="w-full py-4 px-4 text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Creating Pocket...</span>
                      </>
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
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8"
              >
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Join a Pocket</h2>
                    <p className="text-gray-300 text-base">Enter the invite code to join your partner&apos;s budget</p>
                  </div>
                </div>

                <form onSubmit={handleJoinPocket} className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-white mb-3">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={formData.inviteCode}
                      onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                      placeholder="ABC123"
                      maxLength={6}
                      required
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg text-center text-2xl font-mono tracking-wider"
                    />
                    <p className="text-base text-gray-400 mt-3">Ask your partner to share their 6-character invite code</p>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white mb-4">
                      Your Role
                    </label>
                    <div className="space-y-2">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          value="provider"
                          checked={formData.role === 'provider'}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-lg ${
                          formData.role === 'provider'
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/30 bg-white/5'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              formData.role === 'provider' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                              <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-white">Provider</div>
                              <div className="text-sm text-gray-300">I will fund the pocket and manage the budget</div>
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
                        <div className={`p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-lg ${
                          formData.role === 'spender'
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-white/20 hover:border-white/30 bg-white/5'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              formData.role === 'spender' ? 'bg-green-500' : 'bg-gray-500'
                            }`}>
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-white">Spender</div>
                              <div className="text-sm text-gray-300">I will make purchases and log expenses</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center space-x-2 backdrop-blur-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !formData.inviteCode.trim()}
                    className="w-full py-4 px-4 text-lg bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PocketSetup; 