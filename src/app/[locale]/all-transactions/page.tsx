'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { fetchTransactionsPage } from '@/services/pocketService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { EXPENSE_CATEGORIES } from '@/types';
import StatCard from '@/components/ui/StatCard';
import TransactionCard from '@/components/ui/TransactionCard';
import { 
  ArrowLeft,
  Search,
  Download,
  Receipt,
  Filter,
  X,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react';
import { Transaction } from '@/types';
import { useLoadUserNames } from '@/hooks/useLoadUserNames';

interface TransactionWithUser extends Transaction {
  userName?: string;
}

export default function AllTransactionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuthStore();
  const currentPocket = usePocketStore((state) => state.currentPocket);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageCursor, setPageCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fund' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { userNames } = useLoadUserNames(transactions.map((t) => t.userId));

  const transactionsWithUsers = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        userName: userNames[transaction.userId] || 'Unknown User',
      })),
    [transactions, userNames]
  );

  const loadTransactions = async (reset = false) => {
    if (!currentPocket) return;

    if (reset) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await fetchTransactionsPage(
        currentPocket.id,
        20,
        reset ? undefined : pageCursor ?? undefined
      );

      setTransactions((prev) => {
        const base = reset ? [] : prev;
        const existingIds = new Set(base.map((t) => t.id));
        const merged = [...base];

        result.transactions.forEach((tx) => {
          if (!existingIds.has(tx.id)) {
            merged.push(tx);
          }
        });

        return merged;
      });

      setPageCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch (error) {
      logger.error('Error loading transactions', { error, context: { pocketId: currentPocket?.id } });
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
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

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = [...transactionsWithUsers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === filterCategory);
    }

    setFilteredTransactions(filtered);
  }, [transactionsWithUsers, searchTerm, filterType, filterCategory]);

  // Calculate statistics
  const totalFunds = transactionsWithUsers
    .filter(t => t.type === 'fund')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactionsWithUsers
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalFunds - totalExpenses;

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'User'].join(','),
      ...filteredTransactions.map(transaction => [
        formatDate(transaction.date),
        transaction.type,
        transaction.category,
        `"${transaction.description}"`,
        transaction.amount,
        transaction.userName || 'Unknown'
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPocket?.name || 'transactions'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
  };

  if (!user || !currentPocket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-content-with-nav">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md lg:max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">All Transactions</h1>
                <p className="text-sm text-gray-500 truncate">{currentPocket.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                title="Export Data"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md lg:max-w-7xl mx-auto px-4 py-4 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Funds"
            value={formatCurrency(totalFunds)}
            subtitle="Added this month"
            icon={TrendingUp}
            iconColor="green"
            delay={0}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            subtitle="Spent this month"
            icon={Activity}
            iconColor="orange"
            delay={0.1}
          />
          <StatCard
            title="Net Balance"
            value={formatCurrency(Math.abs(netBalance))}
            subtitle={netBalance >= 0 ? 'Remaining funds' : 'Overspent'}
            icon={DollarSign}
            iconColor={netBalance >= 0 ? 'blue' : 'red'}
            delay={0.2}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'fund' | 'expense')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                >
                  <option value="all">All Types</option>
                  <option value="fund">Funds Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          {(searchTerm || filterType !== 'all' || filterCategory !== 'all') && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="space-y-3 lg:space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, index) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                userName={transaction.userName}
                delay={index * 0.05}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? 'No transactions found' 
                  : 'No transactions recorded'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start by adding funds or recording expenses from the dashboard.'
                }
              </p>
              <div className="flex flex-col space-y-3">
                {(searchTerm || filterType !== 'all' || filterCategory !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white rounded-xl px-6 py-3 hover:bg-blue-700 transition-all duration-200 shadow-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="bg-gray-100 text-gray-700 rounded-xl px-6 py-3 hover:bg-gray-200 transition-all duration-200 border border-gray-200 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {!loading && hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => loadTransactions(false)}
              disabled={isLoadingMore}
              className="px-5 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? 'Loading more...' : 'Load more'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
} 
