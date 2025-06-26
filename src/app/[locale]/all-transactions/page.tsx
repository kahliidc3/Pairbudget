'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { getUserProfile } from '@/services/authService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import { 
  ArrowLeft,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Download,
  Receipt,
  Filter,
  X,
  TrendingUp,
  DollarSign,
  Activity
} from 'lucide-react';
import { Transaction } from '@/types';

interface TransactionWithUser extends Transaction {
  userName?: string;
}

export default function AllTransactionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const { user, userProfile } = useAuthStore();
  const { currentPocket, transactions } = usePocketStore();
  const [transactionsWithUsers, setTransactionsWithUsers] = useState<TransactionWithUser[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fund' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load user names for each transaction
  useEffect(() => {
    const loadTransactionUsers = async () => {
      if (!transactions || transactions.length === 0) {
        setTransactionsWithUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const transactionsWithUserData = await Promise.all(
          transactions.map(async (transaction) => {
            try {
              const userProfile = await getUserProfile(transaction.userId);
              return {
                ...transaction,
                userName: userProfile?.name || 'Unknown User'
              };
            } catch (error) {
              console.error('Error loading user for transaction:', error);
              return {
                ...transaction,
                userName: 'Unknown User'
              };
            }
          })
        );

        setTransactionsWithUsers(transactionsWithUserData);
      } catch (error) {
        console.error('Error loading transaction users:', error);
        setTransactionsWithUsers(transactions.map(t => ({ ...t, userName: 'Unknown User' })));
      } finally {
        setLoading(false);
      }
    };

    loadTransactionUsers();
  }, [transactions]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-center font-medium">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-semibold text-slate-900 truncate">{t('title')}</h1>
                <p className="text-xs sm:text-sm text-slate-500 truncate hidden sm:block">{currentPocket.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="hidden lg:flex items-center text-sm text-slate-600 font-medium">
                Welcome, {userProfile?.name || user?.displayName || user?.email?.split('@')[0]}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center"
                title={tCommon('export')}
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6"
        >
          {/* Total Funds */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mobile-card xs-stat-card sm:block">
            <div className="flex items-center justify-between sm:block">
              <div className="stat-content sm:mb-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600 stat-label">Total Funds</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 stat-value">{formatCurrency(totalFunds)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center stat-icon">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mobile-card xs-stat-card sm:block">
            <div className="flex items-center justify-between sm:block">
              <div className="stat-content sm:mb-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600 stat-label">Total Expenses</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600 stat-value">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center stat-icon">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Net Balance */}
          <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mobile-card xs-stat-card sm:block">
            <div className="flex items-center justify-between sm:block">
              <div className="stat-content sm:mb-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600 stat-label">Net Balance</p>
                <p className={`text-lg sm:text-2xl font-bold stat-value ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(netBalance))}
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center stat-icon ${
                netBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-5 h-5 sm:w-6 sm:h-6 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-4 sm:mb-6 mobile-card"
        >
          {/* Search Bar */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mobile-input text-base"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'fund' | 'expense')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">{t('allTypes')}</option>
                  <option value="fund">{t('fundsOnly')}</option>
                  <option value="expense">{t('expensesOnly')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">{t('allCategories')}</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {/* Filter Summary */}
          {(searchTerm || filterType !== 'all' || filterCategory !== 'all') && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? t('transaction') : t('transactions')}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>{t('clearFilters')}</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">{tCommon('loading')}</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'fund' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {transaction.type === 'fund' ? (
                        <ArrowUpRight className="w-6 h-6" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{transaction.description}</h3>
                          {transaction.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 mt-1">
                              {transaction.category}
                            </span>
                          )}
                        </div>
                        <div className={`text-xl font-bold flex-shrink-0 ${
                          transaction.type === 'fund' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {transaction.type === 'fund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{transaction.userName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(transaction.date)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? t('noTransactionsFound') 
                  : t('noTransactionsRecorded')
                }
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? t('adjustFilters')
                  : 'Start by adding funds or recording expenses from the dashboard.'
                }
              </p>
              <div className="flex space-x-3 justify-center">
                {(searchTerm || filterType !== 'all' || filterCategory !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-all duration-200 shadow-sm font-medium flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>{t('clearFilters')}</span>
                  </button>
                )}
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="bg-slate-100 text-slate-700 rounded-lg px-6 py-3 hover:bg-slate-200 transition-all duration-200 border border-slate-200 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
} 