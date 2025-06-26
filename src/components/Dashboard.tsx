'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { addTransaction, leavePocket, cleanupAllSubscriptions } from '@/services/pocketService';
import { removePocketFromUser, getUserProfile } from '@/services/authService';
import { formatCurrency, formatDate, generateInviteLink } from '@/lib/utils';
import { resetFirestoreConnection } from '@/lib/firebase';
import { EXPENSE_CATEGORIES } from '@/types';
import PocketSelector from '@/components/PocketSelector';
import PocketSetup from '@/components/PocketSetup';
import { 
  Plus, 
  Share2, 
  LogOut, 
  TrendingUp, 
  Wallet,
  Copy,
  Check,
  Calendar,
  User,
  UserMinus,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { user, userProfile, signOut, setUserProfile } = useAuthStore();
  const { currentPocket, transactions, clearPocketData } = usePocketStore();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showLeavePocketModal, setShowLeavePocketModal] = useState(false);
  const [showPocketSetup, setShowPocketSetup] = useState(false);
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

  // Calculate recent transactions
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
      
      // Even if there's an error, try to clear local state as a fallback
      try {
        console.log('Attempting to clear local state as fallback...');
        await removePocketFromUser(user.uid, currentPocket.id);
        const updatedPocketIds = (userProfile.pocketIds || []).filter(id => id !== currentPocket.id);
        const newCurrentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
        
        setUserProfile({ 
          ...userProfile, 
          pocketIds: updatedPocketIds,
          currentPocketId: newCurrentPocketId
        });
        clearPocketData();
        setShowLeavePocketModal(false);
        console.log('Fallback cleanup successful');
      } catch (fallbackError) {
        console.error('Fallback cleanup also failed:', fallbackError);
        // Show user feedback that something went wrong
        alert('There was an issue leaving the pocket. Please try refreshing the page.');
      }
    } finally {
      setLeavePocketLoading(false);
    }
  };

  if (!user || !userProfile || !currentPocket) {
    return null;
  }

  const balance = currentPocket.balance || 0;
  const totalFunded = transactions
    .filter(t => t.type === 'fund')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400 relative overflow-hidden">
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
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 60 + 40}px`,
              height: `${Math.random() * 60 + 40}px`,
              background: i % 3 === 0 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                : i % 3 === 1 
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(1px)',
            }}
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Accent Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-400/4 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-400/3 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
      {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <div className="flex items-center space-x-3 md:space-x-6 rtl:space-x-reverse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-bold text-white">PairBudget</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <span className="capitalize text-blue-400 font-medium">{t(`role.${userRole}`)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Pocket Selector */}
                <div className="flex-1 max-w-xs">
                  <PocketSelector onCreateNew={() => setShowPocketSetup(true)} />
                </div>
              </div>

              <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-300">
                  <span className="truncate max-w-32">{t('welcome')}, {userProfile?.name || user?.email?.split('@')[0]}</span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize text-blue-400 font-medium">{t('youAreThe')} {t(`role.${userRole}`)}</span>
                </div>
                
                <div className="flex items-center space-x-1 md:space-x-2">
                  {showRecoveryButton && (
                    <button
                      onClick={handleFirebaseRecovery}
                      disabled={isRecovering}
                      className="p-1.5 md:p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-white/10"
                      title="Manual Firebase Recovery"
                    >
                      <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRecovering ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowInviteCode(true)}
                    className="p-1.5 md:p-2 text-gray-300 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/10"
                    title={t('quickActions.invitePartnerDesc')}
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  
                  <button
                    onClick={signOut}
                    className="p-1.5 md:p-2 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
                    title={tCommon('signOut')}
                  >
                    <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
          >
            {/* Current Balance */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-300 uppercase tracking-wider">{t('stats.currentBalance')}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {formatCurrency(balance)}
              </div>
              <p className="text-sm text-gray-300">
                {balance >= 0 ? t('stats.availableToSpend') : t('stats.overBudget')}
              </p>
            </div>

            {/* Total Funded */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-300 uppercase tracking-wider">{t('stats.totalFunded')}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {formatCurrency(totalFunded)}
              </div>
              <p className="text-sm text-gray-300">{t('stats.moneyAdded')}</p>
            </div>

            {/* Total Spent */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-300 uppercase tracking-wider">{t('stats.totalSpent')}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {formatCurrency(totalSpent)}
              </div>
              <p className="text-sm text-gray-300">{t('stats.moneySpent')}</p>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4">{t('quickActions.title')}</h2>
                
                <div className="space-y-2">
                  {canAddFunds && (
                    <button
                      onClick={() => {
                        setFormData({ ...formData, type: 'fund' });
                        setShowTransactionForm(true);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center space-x-2 group"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{t('quickActions.addFunds')}</div>
                      </div>
                    </button>
                  )}

                  {canAddExpenses && (
                    <button
                      onClick={() => {
                        setFormData({ ...formData, type: 'expense' });
                        setShowTransactionForm(true);
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-3 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 flex items-center space-x-2 group"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{t('quickActions.addExpense')}</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setShowInviteCode(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-3 hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25 flex items-center space-x-2 group"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{t('quickActions.invitePartner')}</div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg md:text-xl font-semibold text-white">{t('recentTransactions.title')}</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => router.push(`/${locale}/all-transactions`)}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      {t('recentTransactions.viewAll')}
                    </button>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            transaction.type === 'fund' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {transaction.type === 'fund' ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white text-base truncate">{transaction.description}</div>
                            <div className="flex items-center space-x-3 text-sm text-gray-300 flex-wrap">
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-20 md:max-w-none">{userNames[transaction.userId] || 'Loading...'}</span>
                              </span>
                              <span className="hidden sm:inline">{transaction.category}</span>
                              <span className="hidden md:inline">{formatDate(transaction.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-lg font-semibold flex-shrink-0 ${
                          transaction.type === 'fund' ? 'text-blue-400' : 'text-orange-400'
                        }`}>
                          {transaction.type === 'fund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{t('recentTransactions.noTransactions')}</h3>
                    <p className="text-gray-300 mb-6">{t('recentTransactions.noTransactionsDesc')}</p>
                    <div className="flex space-x-3 justify-center">
                      {(canAddFunds || canAddExpenses) && (
                        <button
                          onClick={() => setShowTransactionForm(true)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl px-6 py-3 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t('recentTransactions.addTransaction')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/${locale}/all-transactions`)}
                        className="bg-white/10 backdrop-blur-sm text-white rounded-xl px-6 py-3 hover:bg-white/20 transition-all border border-white/20"
                      >
                        {t('recentTransactions.viewAll')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Leave Pocket Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-8 border-t border-white/20"
          >
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('pocketManagement.title')}</h3>
                <p className="text-gray-300 mb-6">{t('pocketManagement.description')}</p>
                
                <button
                  onClick={() => setShowLeavePocketModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl px-6 py-3 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 flex items-center space-x-2 mx-auto"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>{t('pocketManagement.leavePocket')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      <AnimatePresence>
      {showTransactionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowTransactionForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {formData.type === 'fund' ? t('quickActions.addFunds') : t('quickActions.addExpense')}
                </h3>
                <button
                  onClick={() => setShowTransactionForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                {formData.type === 'expense' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select category</option>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                        <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={formData.type === 'fund' ? 'e.g., Monthly allowance' : 'e.g., Grocery shopping'}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (MAD)
                  </label>
                  <input
                  type="number"
                  step="0.01"
                  min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransactionForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={transactionLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 font-medium disabled:opacity-50"
                  >
                    {transactionLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>{formData.type === 'fund' ? t('quickActions.addFunds') : t('quickActions.addExpense')}</span>
                      </div>
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
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowInviteCode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                    </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('quickActions.invitePartner')}</h3>
                <p className="text-gray-600 mb-6">Share this code for them to join your pocket</p>
                
                <div className="bg-gray-100 rounded-xl p-6 mb-6">
                  <div className="text-3xl font-mono font-bold text-gray-800 mb-2 tracking-wider">
                    {currentPocket.inviteCode}
                  </div>
                  <p className="text-sm text-gray-500">Invite Code</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={copyInviteLink}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 font-medium"
                  >
                    {copySuccess ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Copy className="w-4 h-4" />
                        <span>Copy Invite Link</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowInviteCode(false)}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
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
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowLeavePocketModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pocketManagement.leavePocket')}</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to leave this pocket? This action cannot be undone.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleLeavePocket}
                    disabled={leavePocketLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 font-medium disabled:opacity-50"
                  >
                    {leavePocketLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Leaving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <UserMinus className="w-4 h-4" />
                        <span>Yes, Leave Pocket</span>
            </div>
          )}
                  </button>
                  
                  <button
                    onClick={() => setShowLeavePocketModal(false)}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pocket Setup Modal */}
      <AnimatePresence>
        {showPocketSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowPocketSetup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Pocket Management</h2>
                <button
                  onClick={() => setShowPocketSetup(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <PocketSetup onSuccess={() => setShowPocketSetup(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
};

export default Dashboard; 