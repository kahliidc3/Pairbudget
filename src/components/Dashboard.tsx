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
  Activity, ArrowRight, DollarSign, Receipt, TrendingUp,
} from 'lucide-react';

const WalletIcon = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
);

const Dashboard: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const tDashboard = useTranslations('dashboard');
  const tTransactions = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { currentPocket, transactions, clearPocketData, setCurrentPocket } = usePocketStore();

  // Modal state
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionInitialType, setTransactionInitialType] = useState<'fund' | 'expense'>('fund');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showLeavePocketModal, setShowLeavePocketModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(false);
  const [showMobilePocketSheet, setShowMobilePocketSheet] = useState(false);

  // Pocket switcher (load all)
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

  // Loading
  const [activeTab, setActiveTab] = useState('home');
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [leavePocketLoading, setLeavePocketLoading] = useState(false);
  const [editTransactionLoading, setEditTransactionLoading] = useState(false);
  const [deleteTransactionLoading, setDeleteTransactionLoading] = useState(false);
  const [exportDataLoading, setExportDataLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Stats
  const totalFunds = transactions.filter(t => t.type === 'fund').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentBalance = totalFunds - totalExpenses;
  const recentTransactions = transactions.slice(0, 6);
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
    } catch (err) {
      logger.error('Error adding transaction', { error: err, context: { pocketId: currentPocket.id } });
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
        description, amount,
      });
      toast.success(tTransactions('updateSuccess'));
      setShowEditTransactionModal(false);
      setSelectedTransaction(null);
    } catch (err) {
      logger.error('Error updating transaction', { error: err, context: { transactionId: selectedTransaction.id } });
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
    } catch (err) {
      logger.error('Error deleting transaction', { error: err, context: { transactionId: selectedTransaction.id } });
      toast.error(tTransactions('deleteError'));
    } finally {
      setDeleteTransactionLoading(false);
    }
  }, [selectedTransaction, tTransactions, user]);

  const handleLeavePocket = useCallback(async () => {
    if (!user || !userProfile || !currentPocket) return;
    setLeavePocketLoading(true);
    try {
      await leavePocket(currentPocket.id, user.uid);
      await removePocketFromUser(user.uid, currentPocket.id);
      const updatedPocketIds = (userProfile.pocketIds || []).filter(id => id !== currentPocket.id);
      const newCurrentPocketId = updatedPocketIds.length > 0 ? updatedPocketIds[0] : undefined;
      setUserProfile({ ...userProfile, pocketIds: updatedPocketIds, currentPocketId: newCurrentPocketId });
      clearPocketData();
      setShowLeavePocketModal(false);
    } catch (err) {
      logger.error('Error leaving pocket', { error: err, context: { pocketId: currentPocket.id } });
      toast.error('Failed to leave pocket. Please try again.');
    } finally {
      setLeavePocketLoading(false);
    }
  }, [clearPocketData, currentPocket, setUserProfile, user, userProfile]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (err) {
      logger.error('Error signing out', { error: err });
      toast.error('Failed to sign out. Please try again.');
    }
  }, [locale, router]);

  const handleExportData = useCallback(async () => {
    if (!user) return;
    setExportDataLoading(true);
    try {
      await exportUserData(user.uid);
      toast.success(tDashboard('quickActions.exportDataSuccess'));
    } catch (err) {
      logger.error('Error exporting user data', { error: err, context: { userUid: user.uid } });
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

  const userName = user.displayName || user.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Mobile header */}
      <div className="lg:hidden">
        <MobileHeader currentPocket={currentPocket} userProfile={userProfile} onPocketSelect={() => setShowMobilePocketSheet(true)} onInvite={() => setShowInviteCode(true)} />
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block">
        <DesktopHeader
          currentPocket={currentPocket}
          userRole={userRole}
          userProfile={userProfile}
          userName={userName}
          onInvite={() => setShowInviteCode(true)}
          onProfile={() => router.push(`/${locale}/profile`)}
          onSignOut={handleSignOut}
          onPocketSwitcher={() => router.push(`/${locale}/pocket-setup`)}
        />
      </div>

      <div className="detail-shell" style={{ flex: 1 }}>
        {/* Sidebar (desktop only — handled via CSS) */}
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

        {/* Main */}
        <div className="dmain">
          {/* Pocket hero */}
          <div className="pocket-hero">
            <div className="ph-ico"><WalletIcon /></div>
            <div>
              <div className="ph-name">{currentPocket.name}</div>
              <div className="ph-sub">
                Shared Pocket · {userRole === 'provider' ? tDashboard('role.provider') : tDashboard('role.spender')} · {Object.keys(currentPocket.roles).length} {tDashboard('members')}
              </div>
            </div>
            <div className="ph-spacer" />
            <div style={{ textAlign: 'right' }}>
              <div className="ph-bal-l">{tDashboard('stats.currentBalance')}</div>
              <div className="ph-bal">{formatCurrency(Math.abs(currentBalance), { locale, currency: preferredCurrency })}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <StatCard
              title={tDashboard('stats.currentBalance')}
              value={formatCurrency(Math.abs(currentBalance), { locale, currency: preferredCurrency })}
              subtitle={currentBalance >= 0 ? tDashboard('stats.availableToSpend') : tDashboard('stats.overBudget')}
              icon={DollarSign}
              iconColor={currentBalance >= 0 ? 'green' : 'red'}
            />
            <StatCard
              title={tDashboard('stats.totalFunded')}
              value={formatCurrency(totalFunds, { locale, currency: preferredCurrency })}
              subtitle={tDashboard('stats.moneyAdded')}
              icon={TrendingUp}
              iconColor="blue"
            />
            <StatCard
              title={tDashboard('stats.totalSpent')}
              value={formatCurrency(totalExpenses, { locale, currency: preferredCurrency })}
              subtitle={tDashboard('stats.moneySpent')}
              icon={Activity}
              iconColor="orange"
            />
          </div>

          {/* Transactions */}
          <div className="tx-card">
            <div className="tx-card-head">
              <span className="tx-card-title">{tDashboard('recentTransactions.title')}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push(`/${locale}/all-transactions`)}>
                {tDashboard('recentTransactions.viewAll')} <ArrowRight size={13} />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Receipt size={26} style={{ color: 'var(--text-faint)' }} />
                </div>
                <h3 className="t-head" style={{ fontSize: '1rem', marginBottom: '.4rem' }}>{tDashboard('recentTransactions.noTransactions')}</h3>
                <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  {tDashboard('recentTransactions.noTransactionsDesc')}
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setShowTransactionForm(true)}>
                  {tDashboard('recentTransactions.addTransaction')}
                </button>
              </div>
            ) : (
              recentTransactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  userName={userNames[t.userId] || tDashboard('recentTransactions.unknownUser')}
                  currency={preferredCurrency}
                  showActions={canManageTransaction(t)}
                  onEdit={canManageTransaction(t) ? () => openEditTransactionModal(t) : undefined}
                  onDelete={canManageTransaction(t) ? () => openDeleteTransactionModal(t) : undefined}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
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
