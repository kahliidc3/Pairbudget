'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { addTransaction, deleteTransaction, getPocket, leavePocket, updateTransaction } from '@/services/pocketService';
import { removePocketFromUser, signOut, updateUserProfile } from '@/services/authService';
import { exportUserData } from '@/services/exportService';
import { formatCurrency, generateInviteLink } from '@/lib/utils';
import { Pocket, Transaction } from '@/types';
import MobileHeader from '@/components/ui/MobileHeader';
import BottomNavigation from '@/components/ui/BottomNavigation';
import StatCard from '@/components/ui/StatCard';
import TransactionCard from '@/components/ui/TransactionCard';
import QuickActionCard from '@/components/ui/QuickActionCard';
import WaitingOverlay from '@/components/ui/WaitingOverlay';
import DesktopSidebar from '@/components/dashboard/DesktopSidebar';
import DesktopHeader from '@/components/dashboard/DesktopHeader';
import AddTransactionModal from '@/components/dashboard/AddTransactionModal';
import EditTransactionModal from '@/components/dashboard/EditTransactionModal';
import DeleteTransactionModal from '@/components/dashboard/DeleteTransactionModal';
import LeaveModal from '@/components/dashboard/LeaveModal';
import InviteModal from '@/components/dashboard/InviteModal';
import { logger } from '@/lib/logger';
import { useLoadUserNames } from '@/hooks/useLoadUserNames';
import { toast } from 'sonner';
import MobilePocketSheet from '@/components/ui/MobilePocketSheet';
import {
  Activity,
  ArrowRight,
  BarChart3,
  DollarSign,
  Download,
  LogOut,
  Receipt,
  Settings,
  Share2,
  TrendingUp,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const tDashboard = useTranslations('dashboard');
  const tTransactions = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { currentPocket, transactions, clearPocketData, setCurrentPocket } = usePocketStore();

  // Modal visibility
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionInitialType, setTransactionInitialType] = useState<'fund' | 'expense'>('fund');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showLeavePocketModal, setShowLeavePocketModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(false);
  const [showMobilePocketSheet, setShowMobilePocketSheet] = useState(false);

  // Mobile pocket switcher
  const [userPockets, setUserPockets] = useState<Pocket[]>([]);
  const pocketIds = useMemo(() => userProfile?.pocketIds || [], [userProfile?.pocketIds]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (pocketIds.length === 0) { setUserPockets([]); return; }
      try {
        const results = await Promise.all(pocketIds.map(id => getPocket(id).catch(() => null)));
        if (isMounted) setUserPockets(results.filter((p): p is Pocket => p !== null));
      } catch { /* ignore */ }
    };
    load();
    return () => { isMounted = false; };
  }, [pocketIds]);

  const handlePocketSwitch = useCallback(async (pocket: Pocket) => {
    if (!user || !userProfile) return;
    await updateUserProfile(user.uid, { currentPocketId: pocket.id });
    setUserProfile({ ...userProfile, currentPocketId: pocket.id });
    setCurrentPocket(pocket);
  }, [user, userProfile, setUserProfile, setCurrentPocket]);

  // Loading states
  const [activeTab, setActiveTab] = useState('home');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [leavePocketLoading, setLeavePocketLoading] = useState(false);
  const [editTransactionLoading, setEditTransactionLoading] = useState(false);
  const [deleteTransactionLoading, setDeleteTransactionLoading] = useState(false);
  const [exportDataLoading, setExportDataLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Statistics
  const totalFunds = transactions.filter(t => t.type === 'fund').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalFunds - totalExpenses;
  const recentTransactions = transactions.slice(0, 3);
  const { userNames } = useLoadUserNames(recentTransactions.map(t => t.userId));

  const userRole = currentPocket?.roles[user?.uid || ''];
  const preferredCurrency = userProfile?.preferredCurrency;
  const canAddFunds = userRole === 'provider' || userRole === 'spender';
  const canAddExpenses = userRole === 'spender';
  const isWaiting = transactionLoading || leavePocketLoading || exportDataLoading || editTransactionLoading || deleteTransactionLoading;

  const canManageTransaction = useCallback((transaction: Transaction) => {
    if (!user || !currentPocket) return false;
    const role = currentPocket.roles[user.uid];
    return transaction.userId === user.uid || role === 'provider';
  }, [currentPocket, user]);

  const handleTransactionSubmit = useCallback(async (data: { type: 'fund' | 'expense'; category: string; description: string; amount: string }) => {
    if (!user || !currentPocket) return;
    const amount = parseFloat(data.amount);
    if (!amount || amount <= 0) return;
    if (data.description.trim().length > 500) {
      toast.error('Description must be 500 characters or less.');
      return;
    }
    setTransactionLoading(true);
    try {
      await addTransaction(currentPocket.id, user.uid, data.type, data.category, data.description, amount);
      setShowTransactionForm(false);
    } catch (error) {
      logger.error('Error adding transaction', { error, context: { pocketId: currentPocket?.id } });
      toast.error('Failed to add transaction. Please try again.');
    } finally {
      setTransactionLoading(false);
    }
  }, [currentPocket, user]);

  const handleEditTransactionSubmit = useCallback(async (data: { type: 'fund' | 'expense'; category: string; description: string; amount: string }) => {
    if (!user || !selectedTransaction) return;
    const amount = Number(data.amount);
    const description = data.description.trim();
    if (!Number.isFinite(amount) || amount <= 0 || description.length === 0) {
      toast.error(tTransactions('updateError'));
      return;
    }
    if (description.length > 500) {
      toast.error('Description must be 500 characters or less.');
      return;
    }
    setEditTransactionLoading(true);
    try {
      await updateTransaction(selectedTransaction.id, user.uid, {
        type: data.type,
        category: data.type === 'fund' ? '' : data.category,
        description,
        amount,
      });
      toast.success(tTransactions('updateSuccess'));
      setShowEditTransactionModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      logger.error('Error updating transaction', { error, context: { transactionId: selectedTransaction.id } });
      toast.error(tTransactions('updateError'));
    } finally {
      setEditTransactionLoading(false);
    }
  }, [selectedTransaction, tTransactions, user]);

  const handleDeleteTransaction = useCallback(async () => {
    if (!user || !selectedTransaction) return;
    setDeleteTransactionLoading(true);
    try {
      await deleteTransaction(selectedTransaction.id, user.uid);
      toast.success(tTransactions('deleteSuccess'));
      setShowDeleteTransactionModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      logger.error('Error deleting transaction', { error, context: { transactionId: selectedTransaction.id } });
      toast.error(tTransactions('deleteError'));
    } finally {
      setDeleteTransactionLoading(false);
    }
  }, [selectedTransaction, tTransactions, user]);

  const handleLeavePocket = useCallback(async () => {
    if (!user || !userProfile || !currentPocket) return;
    setLeavePocketLoading(true);
    try {
      logger.debug('Initiating pocket leave for current user.', { context: { pocketId: currentPocket.id } });
      await leavePocket(currentPocket.id, user.uid);
      await removePocketFromUser(user.uid, currentPocket.id);
      const updatedPocketIds = (userProfile.pocketIds || []).filter(id => id !== currentPocket.id);
      const newCurrentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
      setUserProfile({ ...userProfile, pocketIds: updatedPocketIds, currentPocketId: newCurrentPocketId });
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

  const openEditTransactionModal = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditTransactionModal(true);
  }, []);

  const openDeleteTransactionModal = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteTransactionModal(true);
  }, []);

  const handleAddTransaction = useCallback((type: 'fund' | 'expense') => {
    setTransactionInitialType(type);
    setShowTransactionForm(true);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === 'history') router.push(`/${locale}/all-transactions`);
    else if (tab === 'settings') router.push(`/${locale}/profile`);
    else if (tab === 'pockets') setShowMobilePocketSheet(true);
  }, [locale, router]);

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

  if (!user || !userProfile || !currentPocket) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader
          currentPocket={currentPocket}
          userProfile={userProfile}
          onPocketSelect={() => setShowMobilePocketSheet(true)}
        />
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <DesktopHeader
          currentPocket={currentPocket}
          userRole={userRole}
          userProfile={userProfile}
          userName={user?.displayName || user?.email?.split('@')[0] || ''}
          onInvite={() => setShowInviteCode(true)}
          onProfile={() => router.push(`/${locale}/profile`)}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-md lg:max-w-none mx-auto px-4 py-4 lg:px-8 pb-20 lg:pb-4">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="space-y-6">
              <DesktopSidebar
                canAddFunds={canAddFunds}
                canAddExpenses={canAddExpenses}
                exportDataLoading={exportDataLoading}
                onAddFunds={() => { setTransactionInitialType('fund'); setShowTransactionForm(true); }}
                onAddExpense={() => { setTransactionInitialType('expense'); setShowTransactionForm(true); }}
                onInvite={() => setShowInviteCode(true)}
                onViewReports={() => router.push(`/${locale}/all-transactions`)}
                onManagePockets={() => router.push(`/${locale}/pocket-setup`)}
                onLeavePocket={() => setShowLeavePocketModal(true)}
                onExportData={handleExportData}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {/* Desktop KPI Cards */}
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

            {/* Mobile Statistics */}
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
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{tDashboard('stats.totalFunded')}</div>
                  <div className="text-sm font-bold text-emerald-600">
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
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all duration-200"
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
                      showActions={canManageTransaction(transaction)}
                      onEdit={canManageTransaction(transaction) ? () => openEditTransactionModal(transaction) : undefined}
                      onDelete={canManageTransaction(transaction) ? () => openDeleteTransactionModal(transaction) : undefined}
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
                    className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    {tDashboard('recentTransactions.addTransaction')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Quick Actions */}
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAddTransaction={handleAddTransaction}
          canAddFunds={canAddFunds}
          canAddExpenses={canAddExpenses}
        />
      </div>

      <MobilePocketSheet
        isOpen={showMobilePocketSheet}
        onClose={() => setShowMobilePocketSheet(false)}
        pockets={userPockets}
        currentPocketId={userProfile?.currentPocketId}
        onSelect={handlePocketSwitch}
      />

      <AddTransactionModal
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        initialType={transactionInitialType}
        onSubmit={handleTransactionSubmit}
        isSubmitting={transactionLoading}
        canAddFunds={canAddFunds}
        canAddExpenses={canAddExpenses}
      />

      <InviteModal
        isOpen={showInviteCode}
        onClose={() => setShowInviteCode(false)}
        inviteCode={currentPocket.inviteCode || ''}
        inviteLink={generateInviteLink(currentPocket.inviteCode || '', locale)}
      />

      <EditTransactionModal
        isOpen={showEditTransactionModal}
        onClose={() => { setShowEditTransactionModal(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onSubmit={handleEditTransactionSubmit}
        isSubmitting={editTransactionLoading}
      />

      <DeleteTransactionModal
        isOpen={showDeleteTransactionModal}
        onClose={() => { setShowDeleteTransactionModal(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onConfirm={handleDeleteTransaction}
        isDeleting={deleteTransactionLoading}
      />

      <LeaveModal
        isOpen={showLeavePocketModal}
        onClose={() => setShowLeavePocketModal(false)}
        onConfirm={handleLeavePocket}
        isLeaving={leavePocketLoading}
      />

      <WaitingOverlay isVisible={isWaiting} label={tCommon('loading')} />
    </div>
  );
};

export default Dashboard;
