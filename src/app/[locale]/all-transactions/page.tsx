'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { deleteTransaction, fetchTransactionsPage, updateTransaction } from '@/services/pocketService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { EXPENSE_CATEGORIES, Transaction } from '@/types';
import StatCard from '@/components/ui/StatCard';
import TransactionCard from '@/components/ui/TransactionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EditTransactionModal from '@/components/dashboard/EditTransactionModal';
import DeleteTransactionModal from '@/components/dashboard/DeleteTransactionModal';
import { toast } from 'sonner';
import {
  Activity, ArrowLeft, DollarSign, Download, Filter, Receipt, Search, TrendingUp, X,
} from 'lucide-react';
import { useLoadUserNames } from '@/hooks/useLoadUserNames';

interface TransactionWithUser extends Transaction {
  userName?: string;
}

export default function AllTransactionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const { user, userProfile } = useAuthStore();
  const preferredCurrency = userProfile?.preferredCurrency;
  const currentPocket = usePocketStore(state => state.currentPocket);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageCursor, setPageCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fund' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { userNames } = useLoadUserNames(transactions.map(t => t.userId));

  const transactionsWithUsers = useMemo(
    () => transactions.map(tx => ({ ...tx, userName: userNames[tx.userId] || t('unknownUser') })),
    [transactions, userNames, t]
  );

  const filteredTransactions = useMemo(() => {
    let f = [...transactionsWithUsers];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      f = f.filter(tx =>
        tx.description.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term) ||
        tx.userName?.toLowerCase().includes(term)
      );
    }
    if (filterType !== 'all') f = f.filter(tx => tx.type === filterType);
    if (filterCategory !== 'all') f = f.filter(tx => tx.category === filterCategory);
    return f;
  }, [transactionsWithUsers, searchTerm, filterType, filterCategory]);

  const loadTransactions = async (reset = false) => {
    if (!currentPocket) return;
    if (reset) setLoading(true); else setIsLoadingMore(true);
    try {
      const result = await fetchTransactionsPage(currentPocket.id, 20, reset ? undefined : pageCursor ?? undefined);
      setTransactions(prev => {
        const base = reset ? [] : prev;
        const ids = new Set(base.map(t => t.id));
        const merged = [...base];
        result.transactions.forEach(tx => { if (!ids.has(tx.id)) merged.push(tx); });
        return merged;
      });
      setPageCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch (error) {
      logger.error('Error loading transactions', { error, context: { pocketId: currentPocket?.id } });
    } finally {
      if (reset) setLoading(false); else setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!currentPocket) return;
    setTransactions([]);
    setPageCursor(null);
    setHasMore(true);
    loadTransactions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPocket?.id]);

  const totalFunds = transactionsWithUsers.filter(t => t.type === 'fund').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactionsWithUsers.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalFunds - totalExpenses;

  const handleExport = () => {
    const csv = [
      [t('csv.date'), t('csv.type'), t('csv.category'), t('csv.description'), t('csv.amount'), t('csv.user')].join(','),
      ...filteredTransactions.map(tx => [
        formatDate(tx.date, locale), tx.type, tx.category, `"${tx.description}"`, tx.amount, tx.userName || t('unknown'),
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPocket?.name || 'transactions'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setSearchTerm(''); setFilterType('all'); setFilterCategory('all'); };

  const canManageTransaction = (tx: Transaction) => {
    if (!user || !currentPocket) return false;
    const role = currentPocket.roles[user.uid];
    return tx.userId === user.uid || role === 'provider';
  };

  const handleUpdateTransaction = async (data: { type: 'fund' | 'expense'; category: string; description: string; amount: string }) => {
    if (!user || !selectedTransaction) return;
    const amount = Number(data.amount);
    const description = data.description.trim();
    if (!Number.isFinite(amount) || amount <= 0 || description.length === 0) {
      toast.error(t('updateError'));
      return;
    }
    setEditLoading(true);
    try {
      await updateTransaction(selectedTransaction.id, user.uid, {
        type: data.type, category: data.type === 'fund' ? '' : data.category, description, amount,
      });
      toast.success(t('updateSuccess'));
      setShowEditModal(false);
      setSelectedTransaction(null);
      await loadTransactions(true);
    } catch (error) {
      logger.error('Error updating transaction', { error, context: { transactionId: selectedTransaction.id } });
      toast.error(t('updateError'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!user || !selectedTransaction) return;
    setDeleteLoading(true);
    try {
      await deleteTransaction(selectedTransaction.id, user.uid);
      toast.success(t('deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedTransaction(null);
      await loadTransactions(true);
    } catch (error) {
      logger.error('Error deleting transaction', { error, context: { transactionId: selectedTransaction.id } });
      toast.error(t('deleteError'));
    } finally {
      setDeleteLoading(false);
    }
  };

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

  if (!user || !currentPocket) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" text={tCommon('loading')} />
      </div>
    );
  }

  const hasFilters = searchTerm || filterType !== 'all' || filterCategory !== 'all';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="nav">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="btn btn-icon btn-ghost"
          aria-label={t('backToDashboard')}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="nav-name">{t('title')}</div>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{currentPocket.name}</div>
        </div>
        <div className="nav-spacer" />
        <div className="nav-right">
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`btn btn-icon ${showFilters ? 'btn-secondary' : 'btn-ghost'}`}
            aria-label={t('toggleFilters')}
          >
            <Filter size={15} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="btn btn-icon btn-ghost"
            title={t('exportData')}
            aria-label={t('exportData')}
          >
            <Download size={15} />
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.75rem 2rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Stats */}
        <div className="stats-row">
          <StatCard
            title={t('totalFunds')}
            value={formatCurrency(totalFunds, { locale, currency: preferredCurrency })}
            subtitle={t('addedThisMonth')}
            icon={TrendingUp}
            iconColor="green"
          />
          <StatCard
            title={t('totalExpenses')}
            value={formatCurrency(totalExpenses, { locale, currency: preferredCurrency })}
            subtitle={t('spentThisMonth')}
            icon={Activity}
            iconColor="orange"
          />
          <StatCard
            title={t('netBalance')}
            value={formatCurrency(Math.abs(netBalance), { locale, currency: preferredCurrency })}
            subtitle={netBalance >= 0 ? t('remainingFunds') : t('overspent')}
            icon={DollarSign}
            iconColor={netBalance >= 0 ? 'blue' : 'red'}
          />
        </div>

        {/* Filters */}
        <div className="card card-padded">
          <div className="field" style={{ marginBottom: showFilters ? '1rem' : 0 }}>
            <div className="input-wrap">
              <Search />
              <input
                id="transaction-search"
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base with-icon"
              />
            </div>
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.85rem' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="filter-type" className="field-label">{t('filterType')}</label>
                <select
                  id="filter-type" value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'fund' | 'expense')}
                  className="input-base"
                >
                  <option value="all">{t('allTypes')}</option>
                  <option value="fund">{t('fundsOnly')}</option>
                  <option value="expense">{t('expensesOnly')}</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="filter-cat" className="field-label">{t('filterCategory')}</label>
                <select
                  id="filter-cat" value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-base"
                >
                  <option value="all">{t('allCategories')}</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {hasFilters && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.85rem', paddingTop: '.85rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                {filteredTransactions.length} {filteredTransactions.length === 1 ? t('transaction') : t('transactions')}
              </span>
              <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm">
                <X size={13} /> {t('clearFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Transactions list */}
        <div className="tx-card">
          {loading ? (
            <div style={{ padding: '3rem 1.5rem' }}>
              <LoadingSpinner size="lg" text={tCommon('loading')} />
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map(tx => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                userName={tx.userName}
                currency={preferredCurrency}
                showActions={canManageTransaction(tx)}
                onEdit={canManageTransaction(tx) ? () => { setSelectedTransaction(tx); setShowEditModal(true); } : undefined}
                onDelete={canManageTransaction(tx) ? () => { setSelectedTransaction(tx); setShowDeleteModal(true); } : undefined}
              />
            ))
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Receipt size={26} style={{ color: 'var(--text-faint)' }} />
              </div>
              <h3 className="t-head" style={{ fontSize: '1rem', marginBottom: '.4rem' }}>
                {hasFilters ? t('noTransactionsFound') : t('noTransactionsRecorded')}
              </h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {hasFilters ? t('adjustFilters') : t('noTransactionsHelp')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem' }}>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="btn btn-primary">
                    <X size={14} /> {t('clearFilters')}
                  </button>
                )}
                <button type="button" onClick={() => router.push(`/${locale}/dashboard`)} className="btn btn-ghost">
                  {t('backToDashboard')}
                </button>
              </div>
            </div>
          )}
        </div>

        {!loading && hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={() => loadTransactions(false)} disabled={isLoadingMore} className="btn btn-ghost">
              {isLoadingMore ? t('loadingMore') : t('loadMore')}
            </button>
          </div>
        )}
      </main>

      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onSubmit={handleUpdateTransaction}
        isSubmitting={editLoading}
      />

      <DeleteTransactionModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onConfirm={handleDeleteTransaction}
        isDeleting={deleteLoading}
      />
    </div>
  );
}
