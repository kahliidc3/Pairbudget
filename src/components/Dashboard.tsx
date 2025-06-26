'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { addTransaction, leavePocket, cleanupAllSubscriptions } from '@/services/pocketService';
import { removePocketFromUser, getUserProfile } from '@/services/authService';
import { formatCurrency, formatDate, generateInviteLink } from '@/lib/utils';
import { resetFirestoreConnection } from '@/lib/firebase';
import { EXPENSE_CATEGORIES } from '@/types';
import PocketSelector from '@/components/PocketSelector';

import { 
  Share2, 
  LogOut, 
  TrendingUp, 
  Wallet,
  Copy,
  Check,

  UserMinus,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  DollarSign,
  Activity,
  Settings,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const { user, userProfile, signOut, setUserProfile } = useAuthStore();
  const { currentPocket, transactions, clearPocketData } = usePocketStore();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showLeavePocketModal, setShowLeavePocketModal] = useState(false);

  const [transactionLoading, setTransactionLoading] = useState(false);
  const [leavePocketLoading, setLeavePocketLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRecoveryButton, setShowRecoveryButton] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [userNames, setUserNames] = useState<{[userId: string]: string}>({});
  const [formData, setFormData] = useState({
    type: 'fund' as 'fund' | 'expense',
    category: '',
    description: '',
    amount: ''
  });

  // Calculate statistics
  const totalFunds = transactions
    .filter(t => t.type === 'fund')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalFunds - totalExpenses;
  const recentTransactions = transactions.slice(0, 3);

  // Load user names for recent transactions
  useEffect(() => {
    const loadUserNames = async () => {
      if (!recentTransactions.length) return;

      const userIds = [...new Set(recentTransactions.map(t => t.userId))];
      const userNameMap: {[userId: string]: string} = {};

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const profile = await getUserProfile(userId);
            userNameMap[userId] = profile?.name || 'Unknown User';
          } catch (error) {
            console.error('Error loading user name:', error);
            userNameMap[userId] = 'Unknown User';
          }
        })
      );

      setUserNames(userNameMap);
    };

    loadUserNames();
  }, [recentTransactions]);

  // Show recovery button in development or when specific key combo is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + R to show recovery button
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setShowRecoveryButton(true);
        console.log('Recovery button activated - use this if you\'re experiencing Firebase connection issues');
        setTimeout(() => setShowRecoveryButton(false), 15000); // Hide after 15 seconds
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFirebaseRecovery = async () => {
    setIsRecovering(true);
    
    try {
      console.log('Manual Firebase recovery triggered...');
      
      // Clean up all subscriptions
      await cleanupAllSubscriptions();
      
      // Reset Firestore connection
      await resetFirestoreConnection();
      
      // Clear local state
      clearPocketData();
      
      // Instead of reloading, just reset the recovery state
      // The app will naturally re-establish subscriptions
      console.log('Firebase recovery completed successfully');
      
    } catch (error) {
      console.error('Error during manual recovery:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  const userRole = currentPocket?.roles[user?.uid || ''];
  const canAddFunds = userRole === 'provider' || userRole === 'spender'; // Both roles can add funds
  const canAddExpenses = userRole === 'spender';

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentPocket) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;

    setTransactionLoading(true);
    try {
      await addTransaction(
        currentPocket.id,
        user.uid,
        formData.type,
        formData.category,
        formData.description,
        amount
      );
      // Don't manually add to store - let the real-time subscription handle it
      setShowTransactionForm(false);
      setFormData({ type: 'fund', category: '', description: '', amount: '' });
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    } finally {
      setTransactionLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!currentPocket?.inviteCode) return;
    
    const link = generateInviteLink(currentPocket.inviteCode);
    await navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLeavePocket = async () => {
    if (!user || !userProfile || !currentPocket) return;

    setLeavePocketLoading(true);
    try {
      console.log(`Attempting to leave pocket ${currentPocket.id} for user ${user.uid}`);
      
      // Try to leave the pocket
      await leavePocket(currentPocket.id, user.uid);
      
      // Remove pocket from user's pocket list
      await removePocketFromUser(user.uid, currentPocket.id);
      
      // Update local state
      const updatedPocketIds = (userProfile.pocketIds || []).filter(id => id !== currentPocket.id);
      const newCurrentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
      
      setUserProfile({ 
        ...userProfile, 
        pocketIds: updatedPocketIds,
        currentPocketId: newCurrentPocketId
      });
      
      // Clear local state
      clearPocketData();
      
      console.log('Successfully left pocket and updated profile');
      setShowLeavePocketModal(false);
      
    } catch (error) {
      console.error('Error leaving pocket:', error);
      alert('Failed to leave pocket. Please try again.');
    } finally {
      setLeavePocketLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await cleanupAllSubscriptions();
      clearPocketData();
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user || !userProfile || !currentPocket) {
    return null; // This should be handled by the parent component
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Modern Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Refined Animated Background Shapes */}
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            {/* Logo and Pocket Info */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{currentPocket.name}</h1>
                <p className="text-sm text-white/70">
                  {userRole === 'provider' ? 'Provider' : 'Spender'} • {Object.keys(currentPocket.roles).length} members
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Pocket Switcher */}
              <PocketSelector onCreateNew={() => router.push(`/${locale}/pocket-setup`)} />
              
              <button
                onClick={() => setShowInviteCode(true)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Share Invite Link"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Sign Out"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32 relative z-10">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Current Balance</p>
                <p className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(currentBalance))}
                </p>
                <p className="text-sm text-white/50 mt-1">
                  {currentBalance >= 0 ? 'Available funds' : 'Overspent'}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                currentBalance >= 0 ? 'bg-green-500/20 backdrop-blur-sm' : 'bg-red-500/20 backdrop-blur-sm'
              }`}>
                <DollarSign className={`w-7 h-7 ${
                  currentBalance >= 0 ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
            </div>
          </motion.div>

          {/* Total Funds */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Total Funds</p>
                <p className="text-3xl font-bold text-blue-400">{formatCurrency(totalFunds)}</p>
                <p className="text-sm text-white/50 mt-1">Added this month</p>
              </div>
              <div className="w-14 h-14 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </motion.div>

          {/* Total Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Total Expenses</p>
                <p className="text-3xl font-bold text-orange-400">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-white/50 mt-1">Spent this month</p>
              </div>
              <div className="w-14 h-14 bg-orange-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl"
          >
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                <button
                  onClick={() => router.push(`/${locale}/all-transactions`)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        transaction.type === 'fund' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {transaction.type === 'fund' ? (
                          <ArrowUpRight className="w-6 h-6" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-white/60">
                          <span>{userNames[transaction.userId] || 'Loading...'}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.date)}</span>
                          {transaction.category && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                                {transaction.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.type === 'fund' ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        {transaction.type === 'fund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No transactions yet</h3>
                  <p className="text-white/60 mb-6">Start by adding funds or recording an expense</p>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    Add First Transaction
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl"
          >
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                {canAddFunds && (
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'fund' }));
                      setShowTransactionForm(true);
                    }}
                    className="w-full p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-all duration-200 group backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <ArrowUpRight className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white">Add Funds</p>
                        <p className="text-sm text-white/60">Add money to the pocket</p>
                      </div>
                    </div>
                  </button>
                )}

                {canAddExpenses && (
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'expense' }));
                      setShowTransactionForm(true);
                    }}
                    className="w-full p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-all duration-200 group backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                        <ArrowDownRight className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white">Record Expense</p>
                        <p className="text-sm text-white/60">Log a purchase or expense</p>
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setShowInviteCode(true)}
                  className="w-full p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <Share2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">Invite Partner</p>
                      <p className="text-sm text-white/60">Share pocket access</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/${locale}/all-transactions`)}
                  className="w-full p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">View Reports</p>
                      <p className="text-sm text-white/60">See all transactions</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const pocketSetupUrl = `/${locale}/pocket-setup`;
                    router.push(pocketSetupUrl);
                  }}
                  className="w-full p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                      <Settings className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">Manage Pockets</p>
                      <p className="text-sm text-white/60">Create or manage pockets</p>
                    </div>
                  </div>
                </button>

                {/* Leave Pocket Button */}
                <button
                  onClick={() => setShowLeavePocketModal(true)}
                  className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-200 group backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                      <LogOut className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">Leave Pocket</p>
                      <p className="text-sm text-white/60">Exit this shared pocket</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Recovery Button (Development) */}
              {showRecoveryButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleFirebaseRecovery}
                  disabled={isRecovering}
                  className="w-full mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isRecovering ? (
                      <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium text-yellow-800">
                      {isRecovering ? 'Recovering...' : 'Recovery Mode'}
                    </span>
                  </div>
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Transaction Form Modal */}
      <AnimatePresence>
        {showTransactionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {formData.type === 'fund' ? 'Add Funds' : 'Record Expense'}
                  </h3>
                  <button
                    onClick={() => setShowTransactionForm(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddTransaction} className="p-6 space-y-6">
                {/* Transaction Type Toggle */}
                <div className="bg-slate-100 rounded-lg p-1">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'fund' }))}
                      className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                        formData.type === 'fund'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Add Funds
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                      className={`py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                        formData.type === 'expense'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Record Expense
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={formData.type === 'fund' ? 'Monthly allowance' : 'Grocery shopping'}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Category (for expenses) */}
                {formData.type === 'expense' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select a category</option>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransactionForm(false)}
                    className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transactionLoading}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    {transactionLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>{formData.type === 'fund' ? 'Add Funds' : 'Record Expense'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Code Modal */}
      <AnimatePresence>
        {showInviteCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Invite Partner</h3>
                  <button
                    onClick={() => setShowInviteCode(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Share2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-slate-600">
                    Share this link with your partner to give them access to this pocket
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-sm font-medium text-slate-700 mb-1">Invite Link</p>
                                             <p className="text-xs text-slate-500 break-all">
                         {generateInviteLink(currentPocket.inviteCode || '')}
                       </p>
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all duration-200"
                    >
                      {copySuccess ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-4">
                    Invite Code: <span className="font-mono font-bold">{currentPocket.inviteCode}</span>
                  </p>
                  <button
                    onClick={() => setShowInviteCode(false)}
                    className="bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Pocket Modal */}
      <AnimatePresence>
        {showLeavePocketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Leave Pocket</h3>
                  <button
                    onClick={() => setShowLeavePocketModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <UserMinus className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Are you sure you want to leave?
                  </h4>
                  <p className="text-slate-600">
                    You will lose access to this pocket and all its transactions. You can rejoin later with an invite link.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLeavePocketModal(false)}
                    className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeavePocket}
                    disabled={leavePocketLoading}
                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    {leavePocketLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Leaving...</span>
                      </>
                    ) : (
                      <span>Leave Pocket</span>
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

export default Dashboard; 