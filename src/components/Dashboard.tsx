'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { addTransaction, leavePocket, cleanupAllSubscriptions } from '@/services/pocketService';
import { removePocketFromUser, getUserProfile } from '@/services/authService';
import PocketSelector from '@/components/PocketSelector';
import { formatCurrency, formatDate, generateInviteLink } from '@/lib/utils';
import { resetFirestoreConnection } from '@/lib/firebase';
import { EXPENSE_CATEGORIES } from '@/types';
import { 
  Plus, 
  Share2, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Copy,
  Check,
  Calendar,
  User,
  UserMinus,
  AlertTriangle,
  RefreshCw,
  Users,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from 'lucide-react';
// Using Font Awesome CSS classes instead of React components for better compatibility

interface DashboardProps {
  onCreateNewPocket?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateNewPocket }) => {
  const router = useRouter();
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

  const balanceColor = (currentPocket?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500';
  const BalanceIcon = (currentPocket?.balance ?? 0) >= 0 ? TrendingUp : TrendingDown;

  if (!currentPocket || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-floating animate-scale-in p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-nav fixed top-3 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl mx-3 md:mx-0"
      >
        <div className="flex items-center justify-between px-3 md:px-4">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800 text-sm md:text-base hidden sm:block">PairBudget</span>
        </div>
            
            {/* Pocket Selector */}
            <div className="flex-1 min-w-0">
              <PocketSelector onCreateNew={onCreateNewPocket || (() => {
                // Fallback behavior
                window.location.reload();
              })} />
        </div>
      </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
              <span className="truncate max-w-32">Welcome, {userProfile?.name || user?.email?.split('@')[0]}</span>
              <span className="text-gray-400">•</span>
              <span className="capitalize text-blue-600 font-medium">{userRole}</span>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-2">
              {showRecoveryButton && (
                <button
                  onClick={handleFirebaseRecovery}
                  disabled={isRecovering}
                  className="p-1.5 md:p-2 text-blue-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                  title="Manual Firebase Recovery"
                >
                  <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRecovering ? 'animate-spin' : ''}`} />
                </button>
              )}
              
              <button
                onClick={() => setShowInviteCode(true)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                title="Share Invite Code"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <button
                onClick={signOut}
                className="p-1.5 md:p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto pt-20 md:pt-24 space-y-6 md:space-y-8">
        {/* Pocket Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8 px-4"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 truncate">{currentPocket.name}</h1>
          <div className="flex items-center justify-center space-x-2 md:space-x-3 text-sm md:text-base text-gray-600 flex-wrap">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span>{currentPocket.participants.length} members</span>
            </div>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="capitalize">You are the {userRole}</span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 px-4"
        >
          {/* Current Balance */}
          <div className="stat-card-balance card-floating col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <BalanceIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide text-right">Current Balance</span>
            </div>
            <div className={`text-2xl md:text-3xl font-bold ${balanceColor} mb-1 md:mb-2`}>
              {formatCurrency(currentPocket.balance)}
            </div>
            <p className="text-xs md:text-sm text-gray-600">
              {currentPocket.balance >= 0 ? 'Available to spend' : 'Over budget'}
            </p>
          </div>

          {/* Total Funded */}
          <div className="stat-card-funded card-floating">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide text-right">Total Funded</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">
              {formatCurrency(currentPocket.totalFunded)}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Money added to pocket</p>
          </div>

          {/* Total Spent */}
          <div className="stat-card-spent card-floating">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide text-right">Total Spent</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">
              {formatCurrency(currentPocket.totalSpent)}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Money spent from pocket</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4">
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="card-floating">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 md:mb-6">Quick Actions</h2>
              
              <div className="space-y-3 md:space-y-4">
                {canAddFunds && (
                  <button
                    onClick={() => {
                      setFormData({ ...formData, type: 'fund' });
                      setShowTransactionForm(true);
                    }}
                    className="w-full p-3 md:p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center space-x-3 group"
                  >
                    <div className="quick-action-icon group-hover:scale-110">
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm md:text-base">Add Funds</div>
                      <div className="text-xs md:text-sm opacity-90">Add money to pocket</div>
                    </div>
                  </button>
                )}

                {canAddExpenses && (
                  <button
                    onClick={() => {
                      setFormData({ ...formData, type: 'expense' });
                      setShowTransactionForm(true);
                    }}
                    className="w-full p-3 md:p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 flex items-center space-x-3 group"
                  >
                    <div className="quick-action-icon group-hover:scale-110">
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm md:text-base">Add Expense</div>
                      <div className="text-xs md:text-sm opacity-90">Record a purchase</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setShowInviteCode(true)}
                  className="w-full p-3 md:p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-3 group"
                >
                  <div className="quick-action-icon group-hover:scale-110">
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm md:text-base">Invite Partner</div>
                    <div className="text-xs md:text-sm opacity-90">Share invite code</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="card-floating">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Recent Transactions</h2>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <button
                    onClick={() => router.push('/all-transactions')}
                    className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    View All
                  </button>
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </div>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {recentTransactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'fund' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {transaction.type === 'fund' ? (
                            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm md:text-base truncate">{transaction.description}</div>
                          <div className="flex items-center space-x-2 md:space-x-3 text-xs md:text-sm text-gray-500 flex-wrap">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-20 md:max-w-none">{userNames[transaction.userId] || 'Loading...'}</span>
                            </span>
                            <span className="hidden sm:inline">{transaction.category}</span>
                            <span className="hidden md:inline">{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm md:text-lg font-semibold flex-shrink-0 ${
                        transaction.type === 'fund' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {transaction.type === 'fund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600 mb-6">Start by adding funds or recording an expense</p>
                  <div className="flex space-x-3 justify-center">
                    {(canAddFunds || canAddExpenses) && (
                      <button
                        onClick={() => setShowTransactionForm(true)}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Transaction
                      </button>
                    )}
                    <button
                      onClick={() => router.push('/all-transactions')}
                      className="btn-secondary"
                    >
                      View All Transactions
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
          className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 px-4"
        >
          <div className="card-floating">
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <UserMinus className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">Pocket Management</h3>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                Need to leave this pocket? You can always create a new one or join another.
              </p>
              
              <button
                onClick={() => setShowLeavePocketModal(true)}
                className="px-4 md:px-6 py-2 md:py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center space-x-2 mx-auto text-sm md:text-base"
              >
                <UserMinus className="w-4 h-4" />
                <span>Leave Pocket</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction Form Modal */}
      <AnimatePresence>
      {showTransactionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTransactionForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-floating max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {formData.type === 'fund' ? 'Add Funds' : 'Add Expense'}
                </h3>
                <button
                  onClick={() => setShowTransactionForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                      className="input-glass w-full"
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
                    className="input-glass w-full"
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
                    className="input-glass w-full"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransactionForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transactionLoading}
                    className="btn-primary flex-1"
                  >
                    {transactionLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>{formData.type === 'fund' ? 'Add Funds' : 'Add Expense'}</span>
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInviteCode(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-floating max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                    </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Invite Your Partner</h3>
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
                    className="btn-primary w-full"
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
                    className="btn-secondary w-full"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowLeavePocketModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-floating max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Leave Pocket</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to leave &quot;{currentPocket.name}&quot;? You&apos;ll need a new invite code to rejoin.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleLeavePocket}
                    disabled={leavePocketLoading}
                    className="w-full py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leavePocketLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Leaving...</span>
                      </div>
                    ) : (
                      'Yes, Leave Pocket'
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowLeavePocketModal(false)}
                    className="btn-secondary w-full"
                  >
                    Cancel
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