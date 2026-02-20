'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { addTransaction, leavePocket } from '@/services/pocketService';
import { deleteUserAccountAndData, removePocketFromUser, signOut } from '@/services/authService';
import { exportUserData } from '@/services/exportService';
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
import { toast } from 'sonner';
import PocketSwitcher from '@/components/PocketSwitcher';

import { 
  Activity, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  DollarSign,
  Download,
  FileText,
  LogOut,
  Receipt,
  RefreshCw,
  Settings,
  Share2,
  TrendingUp,
  UserMinus,
  Wallet
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { user, userProfile, setUserProfile, reset } = useAuthStore();
  const { currentPocket, transactions, clearPocketData } = usePocketStore();
  
  // Modal states
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showLeavePocketModal, setShowLeavePocketModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState('home');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [leavePocketLoading, setLeavePocketLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [exportDataLoading, setExportDataLoading] = useState(false);
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
  const descriptionMaxLength = 500;

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
  const preferredCurrency = userProfile?.preferredCurrency;
  const canAddFunds = userRole === 'provider' || userRole === 'spender'; // Both roles can add funds
  const canAddExpenses = userRole === 'spender';

  const handleTransactionSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentPocket) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;
    if (formData.description.trim().length > descriptionMaxLength) {
      toast.error('Description must be 500 characters or less.');
      return;
    }

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
      toast.error('Failed to add transaction. Please try again.');
    } finally {
      setTransactionLoading(false);
    }
  }, [currentPocket, descriptionMaxLength, formData, user]);

  const copyInviteLink = useCallback(async () => {
    if (!currentPocket?.inviteCode) return;
    
    const link = generateInviteLink(currentPocket.inviteCode, locale);
    await navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [currentPocket?.inviteCode, locale]);

  const handleLeavePocket = useCallback(async () => {
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
      toast.error('Failed to leave pocket. Please try again.');
    } finally {
      setLeavePocketLoading(false);
    }
  }, [clearPocketData, currentPocket, setUserProfile, user, userProfile]);

  const handleDeleteAccount = useCallback(async () => {
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
  }, [clearPocketData, locale, reset, router, user]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      logger.error('Error signing out', { error });
      toast.error('Failed to sign out. Please try again.');
    }
  }, [locale, router]);

  const handleExportData = useCallback(async () => {
    if (!user) return;

    setExportDataLoading(true);
    try {
      await exportUserData(user.uid);
      toast.success(tDashboard('quickActions.exportDataSuccess'));
    } catch (error) {
      logger.error('Error exporting user data', { error, context: { userUid: user.uid } });
      toast.error(tDashboard('quickActions.exportDataError'));
    } finally {
      setExportDataLoading(false);
    }
  }, [tDashboard, user]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.altKey && (event.key === 'h' || event.key === 'H')) {
        event.preventDefault();
        router.push(`/${locale}/dashboard`);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [locale, router]);


  // Handle tab changes
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === 'history') {
      router.push(`/${locale}/all-transactions`);
    } else if (tab === 'settings') {
      setShowLeavePocketModal(true);
    }
  }, [locale, router]);

  // Handle transaction modal
  const handleAddTransaction = useCallback((type: 'fund' | 'expense') => {
    setFormData(prev => ({ ...prev, type }));
    setShowTransactionForm(true);
  }, []);

  if (!user || !userProfile || !currentPocket) {
    return null;
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - only show on mobile */}
      <div className="lg:hidden">
        <MobileHeader
          currentPocket={currentPocket}
          userProfile={userProfile}
          onPocketSelect={() => router.push(`/${locale}/pocket-setup`)}
        />
      </div>

      {/* Desktop Header - only show on desktop */}
      <div className="hidden lg:block">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="w-full px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{currentPocket.name}</h1>
                  <p className="text-sm text-gray-600">
                    {userRole === 'provider' ? tDashboard('role.provider') : tDashboard('role.spender')} • {Object.keys(currentPocket.roles).length} {tDashboard('members')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 font-medium">
                  {tDashboard('welcome')}, {userProfile?.name || user?.displayName || user?.email?.split('@')[0]}
                </div>
                <PocketSwitcher />
                <button
                  onClick={() => setShowInviteCode(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title={tDashboard('quickActions.invitePartner')}
                  aria-label={tDashboard('quickActions.invitePartner')}
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title={tCommon('signOut')}
                  aria-label={tCommon('signOut')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="max-w-md lg:max-w-none mx-auto px-4 py-4 lg:px-8 pb-20 lg:pb-4">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="space-y-6">
              {/* Quick Actions for Desktop */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{tDashboard('quickActions.title')}</h3>
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
                        <p className="font-semibold text-gray-900">{tDashboard('quickActions.addFunds')}</p>
                        <p className="text-sm text-gray-600">{tDashboard('quickActions.addFundsDesc')}</p>
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
                        <p className="font-semibold text-gray-900">{tDashboard('quickActions.addExpense')}</p>
                        <p className="text-sm text-gray-600">{tDashboard('quickActions.addExpenseDesc')}</p>
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
                      <p className="font-semibold text-gray-900">{tDashboard('quickActions.invitePartner')}</p>
                      <p className="text-sm text-gray-600">{tDashboard('quickActions.invitePartnerDesc')}</p>
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
                      <p className="font-semibold text-gray-900">{tDashboard('quickActions.viewReports')}</p>
                      <p className="text-sm text-gray-600">{tDashboard('quickActions.viewReportsDesc')}</p>
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
                      <p className="font-semibold text-gray-900">{tDashboard('quickActions.managePockets')}</p>
                      <p className="text-sm text-gray-600">{tDashboard('quickActions.managePocketsDesc')}</p>
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
                      <p className="font-semibold text-gray-900">{tDashboard('quickActions.leavePocket')}</p>
                      <p className="text-sm text-gray-600">{tDashboard('quickActions.leavePocketDesc')}</p>
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
                      <p className="font-semibold text-gray-900">{tDashboard('quickActions.deleteAccount')}</p>
                      <p className="text-sm text-gray-600">{tDashboard('quickActions.deleteAccountDesc')}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportData}
                    disabled={exportDataLoading}
                    className="w-full flex items-center space-x-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center">
                      <Download className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{tDashboard('quickActions.exportData')}</p>
                      <p className="text-sm text-gray-600">{tDashboard('quickActions.exportDataDesc')}</p>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {/* Desktop KPI Cards - only show on desktop */}
            <div className="hidden lg:block mb-6">
              <div className="grid grid-cols-3 gap-6">
                <StatCard
                  title={tDashboard('stats.currentBalance')}
                  value={formatCurrency(Math.abs(currentBalance), { locale, currency: preferredCurrency })}
                  subtitle={currentBalance >= 0 ? tDashboard('stats.availableToSpend') : tDashboard('stats.overBudget')}
                  icon={DollarSign}
                  iconColor={currentBalance >= 0 ? 'green' : 'red'}
                  delay={0}
                />
                <StatCard
                  title={tDashboard('stats.totalFunded')}
                  value={formatCurrency(totalFunds, { locale, currency: preferredCurrency })}
                  subtitle={tDashboard('stats.moneyAdded')}
                  icon={TrendingUp}
                  iconColor="blue"
                  delay={0.1}
                />
                <StatCard
                  title={tDashboard('stats.totalSpent')}
                  value={formatCurrency(totalExpenses, { locale, currency: preferredCurrency })}
                  subtitle={tDashboard('stats.moneySpent')}
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
                  <div className="text-xs font-medium text-gray-600 mb-1">{tDashboard('stats.currentBalance')}</div>
                  <div className={`text-sm font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(currentBalance), { locale, currency: preferredCurrency })}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{tDashboard('stats.totalFunded')}</div>
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(totalFunds, { locale, currency: preferredCurrency })}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{tDashboard('stats.totalSpent')}</div>
                  <div className="text-sm font-bold text-orange-600">
                    {formatCurrency(totalExpenses, { locale, currency: preferredCurrency })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{tDashboard('recentTransactions.title')}</h2>
                <button
                  onClick={() => router.push(`/${locale}/all-transactions`)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <span>{tDashboard('recentTransactions.viewAll')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction, index) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      userName={userNames[transaction.userId] || tDashboard('recentTransactions.unknownUser')}
                      currency={preferredCurrency}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tDashboard('recentTransactions.noTransactions')}</h3>
                  <p className="text-gray-600 mb-6">{tDashboard('recentTransactions.noTransactionsDesc')}</p>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    {tDashboard('recentTransactions.addTransaction')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Quick Actions - only show on mobile */}
            <div className="lg:hidden mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{tDashboard('quickActions.title')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickActionCard
                  title={tDashboard('quickActions.invitePartner')}
                  subtitle={tDashboard('quickActions.invitePartnerDesc')}
                  icon={Share2}
                  color="purple"
                  onClick={() => setShowInviteCode(true)}
                  delay={0}
                />
                <QuickActionCard
                  title={tDashboard('quickActions.viewReports')}
                  subtitle={tDashboard('quickActions.viewReportsDesc')}
                  icon={BarChart3}
                  color="blue"
                  onClick={() => router.push(`/${locale}/all-transactions`)}
                  delay={0.1}
                />
                <QuickActionCard
                  title={tDashboard('quickActions.managePockets')}
                  subtitle={tDashboard('quickActions.managePocketsDesc')}
                  icon={Settings}
                  color="gray"
                  onClick={() => router.push(`/${locale}/pocket-setup`)}
                  delay={0.2}
                />
                <QuickActionCard
                  title={tDashboard('quickActions.leavePocket')}
                  subtitle={tDashboard('quickActions.leavePocketDesc')}
                  icon={LogOut}
                  color="red"
                  onClick={() => setShowLeavePocketModal(true)}
                  delay={0.3}
                />
                <QuickActionCard
                  title={tDashboard('quickActions.exportData')}
                  subtitle={tDashboard('quickActions.exportDataDesc')}
                  icon={Download}
                  color="blue"
                  onClick={handleExportData}
                  delay={0.5}
                />
                <QuickActionCard
                  title={tDashboard('quickActions.deleteAccount')}
                  subtitle={tDashboard('quickActions.deleteAccountDesc')}
                  icon={AlertTriangle}
                  color="orange"
                  onClick={() => setShowDeleteAccountModal(true)}
                  delay={0.6}
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
              maxLength={descriptionMaxLength}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            />
            <p className="mt-2 text-xs text-gray-500 text-right">
              {formData.description.length}/{descriptionMaxLength}
            </p>
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
              disabled={transactionLoading}
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
                  {generateInviteLink(currentPocket.inviteCode || '', locale)}
                </p>
              </div>
              <button
                onClick={copyInviteLink}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-200"
                aria-label="Copy invite link"
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
              disabled={leavePocketLoading}
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
