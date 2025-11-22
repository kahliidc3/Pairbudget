'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { addTransaction, leavePocket } from '@/services/pocketService';
import { removePocketFromUser, signOut, deleteUserAccountAndData } from '@/services/authService';
import { formatCurrency, generateInviteLink } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import MobileHeader from '@/components/ui/MobileHeader';
import BottomNavigation from '@/components/ui/BottomNavigation';
import StatCard from '@/components/ui/StatCard';
import TransactionCard from '@/components/ui/TransactionCard';
import QuickActionCard from '@/components/ui/QuickActionCard';
import MobileModal from '@/components/ui/MobileModal';
import { logger } from '@/lib/logger';
import { useLoadUserNames } from '@/hooks/useLoadUserNames';

import { 
  Share2, 
  LogOut, 
  TrendingUp, 
  Wallet,
  Copy,
  Check,
  UserMinus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  DollarSign,
  Activity,
  Settings,
  BarChart3,
  ArrowRight,
  FileText,
  AlertTriangle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const { user, userProfile, setUserProfile, reset } = useAuthStore();
  const { currentPocket, transactions, clearPocketData } = usePocketStore();
  
  // Modal states
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showLeavePocketModal, setShowLeavePocketModal] = useState(false);
  const [showPocketSelector, setShowPocketSelector] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState('home');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [leavePocketLoading, setLeavePocketLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState('');
  
  // Form state
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
  const { userNames } = useLoadUserNames(recentTransactions.map(t => t.userId));



  const userRole = currentPocket?.roles[user?.uid || ''];
  const canAddFunds = userRole === 'provider' || userRole === 'spender'; // Both roles can add funds
  const canAddExpenses = userRole === 'spender';

  const handleTransactionSubmit = async (e: React.FormEvent) => {
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
      logger.error('Error adding transaction', { error, context: { pocketId: currentPocket?.id } });
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
      logger.debug('Initiating pocket leave for current user.', { context: { pocketId: currentPocket.id } });
      
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
      
      logger.info('Successfully left pocket and updated profile.', { context: { pocketId: currentPocket.id } });
      setShowLeavePocketModal(false);
      
    } catch (error) {
      logger.error('Error leaving pocket', { error, context: { pocketId: currentPocket?.id } });
      alert('Failed to leave pocket. Please try again.');
    } finally {
      setLeavePocketLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleteAccountLoading(true);
    setDeleteAccountError(null);

    try {
      await deleteUserAccountAndData();
      clearPocketData();
      reset();
      setDeleteAccountConfirm('');
      setShowDeleteAccountModal(false);
      router.replace(`/${locale}`);
    } catch (error) {
      logger.error('Error deleting account', { error });
      setDeleteAccountError(error instanceof Error ? error.message : 'Failed to delete account. Please try again later.');
      setDeleteAccountLoading(false);
      return;
    }

    setDeleteAccountLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      logger.error('Error signing out', { error });
      alert('Failed to sign out. Please try again.');
    }
  };


  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'history') {
      router.push(`/${locale}/all-transactions`);
    } else if (tab === 'settings') {
      setShowLeavePocketModal(true);
    }
  };

  // Handle transaction modal
  const handleAddTransaction = (type: 'fund' | 'expense') => {
    setFormData(prev => ({ ...prev, type }));
    setShowTransactionForm(true);
  };

  if (!user || !userProfile || !currentPocket) {
    return null; // This should be handled by the parent component
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - only show on mobile */}
      <div className="lg:hidden">
        <MobileHeader
          currentPocket={currentPocket}
          userProfile={userProfile}
          onPocketSelect={() => setShowPocketSelector(true)}
        />
      </div>

      {/* Desktop Header - only show on desktop */}
      <div className="hidden lg:block">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{currentPocket.name}</h1>
                  <p className="text-sm text-gray-600">
                    {userRole === 'provider' ? 'Provider' : 'Spender'} • {Object.keys(currentPocket.roles).length} members
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 font-medium">
                  Welcome, {userProfile?.name || user?.displayName || user?.email?.split('@')[0]}
                </div>
                <button
                  onClick={() => setShowInviteCode(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Share Invite Link"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="max-w-md lg:max-w-7xl mx-auto px-4 py-4 lg:px-8 pb-20 lg:pb-4">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="space-y-6">
              {/* Quick Actions for Desktop */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {canAddFunds && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: 'fund' }));
                        setShowTransactionForm(true);
                      }}
                      className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Add Funds</p>
                        <p className="text-sm text-gray-600">Add money to pocket</p>
                      </div>
                    </button>
                  )}
                  
                  {canAddExpenses && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, type: 'expense' }));
                        setShowTransactionForm(true);
                      }}
                      className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center">
                        <ArrowDownRight className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Add Expense</p>
                        <p className="text-sm text-gray-600">Record a purchase</p>
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowInviteCode(true)}
                    className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Invite Partner</p>
                      <p className="text-sm text-gray-600">Share pocket access</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/${locale}/all-transactions`)}
                    className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">View Reports</p>
                      <p className="text-sm text-gray-600">See all transactions</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/${locale}/pocket-setup`)}
                    className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Manage Pockets</p>
                      <p className="text-sm text-gray-600">Create or manage</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowLeavePocketModal(true)}
                    className="w-full flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Leave Pocket</p>
                      <p className="text-sm text-gray-600">Exit this pocket</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Delete Account</p>
                      <p className="text-sm text-gray-600">Remove profile and data</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Desktop Statistics */}
              <div className="space-y-4">
                <StatCard
                  title="Current Balance"
                  value={formatCurrency(Math.abs(currentBalance))}
                  subtitle={currentBalance >= 0 ? 'Available funds' : 'Overspent'}
                  icon={DollarSign}
                  iconColor={currentBalance >= 0 ? 'green' : 'red'}
                  delay={0}
                />
                <StatCard
                  title="Total Funds"
                  value={formatCurrency(totalFunds)}
                  subtitle="Added this month"
                  icon={TrendingUp}
                  iconColor="blue"
                  delay={0.1}
                />
                <StatCard
                  title="Total Expenses"
                  value={formatCurrency(totalExpenses)}
                  subtitle="Spent this month"
                  icon={Activity}
                  iconColor="orange"
                  delay={0.2}
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {/* Desktop KPI Cards - only show on desktop */}
            <div className="hidden lg:block mb-6">
              <div className="grid grid-cols-3 gap-6">
                <StatCard
                  title="Current Balance"
                  value={formatCurrency(Math.abs(currentBalance))}
                  subtitle={currentBalance >= 0 ? 'Available funds' : 'Overspent'}
                  icon={DollarSign}
                  iconColor={currentBalance >= 0 ? 'green' : 'red'}
                  delay={0}
                />
                <StatCard
                  title="Total Funds"
                  value={formatCurrency(totalFunds)}
                  subtitle="Added this month"
                  icon={TrendingUp}
                  iconColor="blue"
                  delay={0.1}
                />
                <StatCard
                  title="Total Expenses"
                  value={formatCurrency(totalExpenses)}
                  subtitle="Spent this month"
                  icon={Activity}
                  iconColor="orange"
                  delay={0.2}
                />
              </div>
            </div>

            {/* Mobile Statistics - only show on mobile */}
            <div className="lg:hidden mb-6">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <DollarSign className={`w-4 h-4 ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Balance</div>
                  <div className={`text-sm font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(currentBalance))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Funds</div>
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(totalFunds)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-1">Expenses</div>
                  <div className="text-sm font-bold text-orange-600">
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <button
                  onClick={() => router.push(`/${locale}/all-transactions`)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction, index) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      userName={userNames[transaction.userId] || 'Unknown User'}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600 mb-6">Start by adding funds or recording an expense</p>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    Add First Transaction
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Quick Actions - only show on mobile */}
            <div className="lg:hidden mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickActionCard
                  title="Invite Partner"
                  subtitle="Share pocket access"
                  icon={Share2}
                  color="purple"
                  onClick={() => setShowInviteCode(true)}
                  delay={0}
                />
                <QuickActionCard
                  title="View Reports"
                  subtitle="See all transactions"
                  icon={BarChart3}
                  color="blue"
                  onClick={() => router.push(`/${locale}/all-transactions`)}
                  delay={0.1}
                />
                <QuickActionCard
                  title="Manage Pockets"
                  subtitle="Create or manage pockets"
                  icon={Settings}
                  color="gray"
                  onClick={() => router.push(`/${locale}/pocket-setup`)}
                  delay={0.2}
                />
                <QuickActionCard
                  title="Leave Pocket"
                  subtitle="Exit this shared pocket"
                  icon={LogOut}
                  color="red"
                  onClick={() => setShowLeavePocketModal(true)}
                  delay={0.3}
                />
                <QuickActionCard
                  title="Delete Account"
                  subtitle="Remove all data"
                  icon={AlertTriangle}
                  color="orange"
                  onClick={() => setShowDeleteAccountModal(true)}
                  delay={0.4}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation - only show on mobile */}
      <div className="lg:hidden">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAddTransaction={handleAddTransaction}
          canAddFunds={canAddFunds}
          canAddExpenses={canAddExpenses}
        />
      </div>

      {/* Pocket Selector Modal */}
      <MobileModal
        isOpen={showPocketSelector}
        onClose={() => setShowPocketSelector(false)}
        title="Select Pocket"
        fullScreen={true}
      >
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Pocket selection has been moved to a dedicated page</p>
            <button
              onClick={() => {
                setShowPocketSelector(false);
                router.push(`/${locale}/pocket-setup`);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              Manage Pockets
            </button>
          </div>
        </div>
      </MobileModal>

      {/* Transaction Form Modal */}
      <MobileModal
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        title={formData.type === 'fund' ? 'Add Funds' : 'Record Expense'}
      >
        <form onSubmit={handleTransactionSubmit} className="p-4 space-y-4">
          {/* Transaction Type Toggle */}
          <div className="bg-gray-100 rounded-xl p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'fund' }))}
                className={`py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  formData.type === 'fund'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Add Funds
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                className={`py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  formData.type === 'expense'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Record Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={formData.type === 'fund' ? 'Monthly allowance' : 'Grocery shopping'}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>

          {/* Category (for expenses) */}
          {formData.type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
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
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transactionLoading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2 text-base"
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
      </MobileModal>

      {/* Invite Code Modal */}
      <MobileModal
        isOpen={showInviteCode}
        onClose={() => setShowInviteCode(false)}
        title="Invite Partner"
      >
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600">
              Share this link with your partner to give them access to this pocket
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Invite Link</p>
                <p className="text-xs text-gray-500 break-all">
                  {generateInviteLink(currentPocket.inviteCode || '')}
                </p>
              </div>
              <button
                onClick={copyInviteLink}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-200"
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
            <p className="text-sm text-gray-500 mb-4">
              Invite Code: <span className="font-mono font-bold">{currentPocket.inviteCode}</span>
            </p>
            <button
              onClick={() => setShowInviteCode(false)}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </MobileModal>

      {/* Leave Pocket Modal */}
      <MobileModal
        isOpen={showLeavePocketModal}
        onClose={() => setShowLeavePocketModal(false)}
        title="Leave Pocket"
      >
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserMinus className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to leave?
            </h4>
            <p className="text-gray-600">
              You will lose access to this pocket and all its transactions. You can rejoin later with an invite link.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowLeavePocketModal(false)}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleLeavePocket}
              disabled={leavePocketLoading}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
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
      </MobileModal>

      {/* Delete Account Modal */}
      <MobileModal
        isOpen={showDeleteAccountModal}
        onClose={() => {
          if (deleteAccountLoading) return;
          setShowDeleteAccountModal(false);
          setDeleteAccountConfirm('');
          setDeleteAccountError(null);
        }}
        title="Delete Account"
      >
        <div className="p-4 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Permanently delete your account?
            </h4>
            <p className="text-gray-600 text-sm">
              This will remove your profile, transactions, and pocket memberships. The action cannot be undone.
            </p>
          </div>

          {deleteAccountError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {deleteAccountError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-semibold">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteAccountConfirm}
              onChange={(event) => setDeleteAccountConfirm(event.target.value.toUpperCase())}
              disabled={deleteAccountLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              placeholder="DELETE"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => {
                if (deleteAccountLoading) return;
                setShowDeleteAccountModal(false);
                setDeleteAccountConfirm('');
                setDeleteAccountError(null);
              }}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              disabled={deleteAccountLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteAccountLoading || deleteAccountConfirm !== 'DELETE'}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              {deleteAccountLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Account</span>
              )}
            </button>
          </div>
        </div>
      </MobileModal>
    </div>
  );
};

export default Dashboard; 
