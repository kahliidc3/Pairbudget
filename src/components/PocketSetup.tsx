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
  Shield,
  Sparkles,
  Check,
  AlertCircle,
  Users,
  Zap,
  LogOut,
  Target,

  TrendingUp
} from 'lucide-react';

interface PocketSetupProps {
  onSuccess?: () => void;
}

const PocketSetup: React.FC<PocketSetupProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    inviteCode: '',
    role: 'provider' as UserRole
  });
  const { user, userProfile, setUserProfile, signOut } = useAuthStore();
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-nav fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-between w-full max-w-4xl mx-auto px-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-800">PairBudget</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 hidden md:block">
            Welcome, {userProfile?.name || user?.email?.split('@')[0]}
          </span>
          <button
            onClick={signOut}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      <div className="w-full max-w-6xl mx-auto pt-24 relative">
        {/* Background Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="geometric-blob"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          {/* App Introduction Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl mb-6 relative">
              <Wallet className="w-10 h-10 text-white" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
      </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Welcome to PairBudget
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              The smart way to track shared expenses with your partner. Create transparent, 
              real-time budgets that keep you both on the same financial page.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card-floating p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Perfect for Two</h3>
                <p className="text-sm text-gray-600">Designed specifically for couples and partners to track shared expenses together.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card-floating p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Real-time Sync</h3>
                <p className="text-sm text-gray-600">All transactions sync instantly between both partners in real-time.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="card-floating p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Secure & Private</h3>
                <p className="text-sm text-gray-600">Your financial data is encrypted and only accessible to you two.</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Getting Started Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Get Started</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create a new shared pocket or join an existing one to start tracking expenses together.
            </p>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card-floating max-w-2xl mx-auto mb-8"
          >
            <div className="flex p-2 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setMode('create')}
                className={`flex-1 py-4 px-6 text-sm font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                mode === 'create'
                    ? 'bg-white text-purple-600 shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
                <Plus className="w-5 h-5" />
                <span>Create New Pocket</span>
            </button>
            <button
              onClick={() => setMode('join')}
                className={`flex-1 py-4 px-6 text-sm font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                mode === 'join'
                    ? 'bg-white text-blue-600 shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
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
                transition={{ duration: 0.5 }}
                className="card-floating max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left - Form */}
                  <div>
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-title mb-2">Create Your Pocket</h2>
                      <p className="text-gray-600">Set up a new shared expense pocket for you and your partner.</p>
                    </div>

                    <form onSubmit={handleCreatePocket} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Pocket Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Family Budget, Weekend Getaway"
                          required
                          className="input-glass w-full"
                        />
                      </div>

              <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                  Your Role
                </label>
                        <div className="grid grid-cols-1 gap-4">
                          <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="provider"
                              checked={formData.role === 'provider'}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                              className="sr-only"
                            />
                            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              formData.role === 'provider'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'provider' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}>
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                    <div>
                                  <div className="font-medium text-gray-900">Provider</div>
                                  <div className="text-sm text-gray-600">I will fund the pocket and manage the budget</div>
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
                            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              formData.role === 'spender'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'spender' ? 'bg-green-500' : 'bg-gray-400'
                                }`}>
                                  <Wallet className="w-5 h-5 text-white" />
                                </div>
                    <div>
                                  <div className="font-medium text-gray-900">Spender</div>
                                  <div className="text-sm text-gray-600">I will make purchases and log expenses</div>
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
                          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-red-700 text-sm">{error}</span>
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !formData.name.trim()}
                        className="btn-primary w-full"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <span>Creating Pocket...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Create Pocket</span>
                          </div>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right - Benefits */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Why Create a Pocket?</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Perfect for Two</h4>
                          <p className="text-gray-600 text-sm">Designed specifically for couples and partners to track shared expenses.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Real-time Sync</h4>
                          <p className="text-gray-600 text-sm">All transactions sync instantly between both partners.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Secure & Private</h4>
                          <p className="text-gray-600 text-sm">Your financial data is encrypted and only accessible to you two.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Target className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Goal Tracking</h4>
                          <p className="text-gray-600 text-sm">Set and track financial goals together with clear visibility.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Smart Insights</h4>
                          <p className="text-gray-600 text-sm">Get insights into spending patterns and budget trends.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="card-floating max-w-3xl mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left - Form */}
                  <div>
                    <div className="mb-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
                        <UserPlus className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-title mb-2">Join a Pocket</h2>
                      <p className="text-gray-600">Enter the invite code your partner shared with you to join their budget.</p>
                    </div>

                    <form onSubmit={handleJoinPocket} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Invite Code
                        </label>
                        <input
                          type="text"
                          value={formData.inviteCode}
                          onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                          placeholder="ABC123"
                          maxLength={6}
                          required
                          className="input-glass w-full text-center text-2xl font-mono tracking-wider"
                        />
                        <p className="text-sm text-gray-500 mt-2">Ask your partner to share their 6-character invite code</p>
                      </div>

              <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                  Your Role
                </label>
                        <div className="grid grid-cols-1 gap-4">
                          <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="provider"
                              checked={formData.role === 'provider'}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                              className="sr-only"
                            />
                            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              formData.role === 'provider'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'provider' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}>
                                  <CreditCard className="w-5 h-5 text-white" />
                                </div>
                    <div>
                                  <div className="font-medium text-gray-900">Provider</div>
                                  <div className="text-sm text-gray-600">I will fund the pocket and manage the budget</div>
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
                            <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              formData.role === 'spender'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  formData.role === 'spender' ? 'bg-green-500' : 'bg-gray-400'
                                }`}>
                                  <Wallet className="w-5 h-5 text-white" />
                                </div>
                    <div>
                                  <div className="font-medium text-gray-900">Spender</div>
                                  <div className="text-sm text-gray-600">I will make purchases and log expenses</div>
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
                          className="p-4 bg-red-50 border border-red-200 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{error}</p>
                </div>
                        </motion.div>
              )}

                      <button
                type="submit"
                        disabled={loading || !formData.inviteCode.trim()}
                        className="btn-primary w-full py-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </div>

                  {/* Right - Join Benefits */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-6">What Happens Next?</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Check className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Instant Access</h4>
                          <p className="text-gray-600 text-sm">Get immediate access to your shared budget and transaction history.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Role-Based Access</h4>
                          <p className="text-gray-600 text-sm">Your selected role determines what actions you can perform in the budget.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Zap className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Real-time Updates</h4>
                          <p className="text-gray-600 text-sm">See all transactions and balance changes in real-time.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Secure Connection</h4>
                          <p className="text-gray-600 text-sm">Your connection to the pocket is encrypted and secure.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
                          <p className="text-blue-700 text-sm">Make sure to coordinate with your partner about who takes which role to avoid conflicts!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default PocketSetup; 