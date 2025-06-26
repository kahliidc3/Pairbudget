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
  X
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
  const { user } = useAuthStore();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400 relative overflow-hidden">
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

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-xl relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-center">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="p-2 text-gray-300 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-white">{t('title')}</h1>
                  <p className="text-sm text-gray-300 truncate">{t('description')} {currentPocket.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-300 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/10"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 text-gray-300 hover:text-green-400 transition-colors rounded-lg hover:bg-white/10"
                  title={tCommon('export')}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6 shadow-xl"
          >
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'fund' | 'expense')}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="all">{t('allTypes')}</option>
                    <option value="fund">{t('fundsOnly')}</option>
                    <option value="expense">{t('expensesOnly')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                <div className="text-sm text-gray-300">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? t('transaction') : t('transactions')}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
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
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden"
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-300">{tCommon('loading')}</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="divide-y divide-white/10">
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'fund' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {transaction.type === 'fund' ? (
                          <ArrowUpRight className="w-6 h-6" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-white text-lg">{transaction.description}</div>
                          <div className={`text-xl font-bold flex-shrink-0 ${
                            transaction.type === 'fund' ? 'text-blue-400' : 'text-orange-400'
                          }`}>
                            {transaction.type === 'fund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                          <span className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{transaction.userName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(transaction.date)}</span>
                          </span>
                          {transaction.category && (
                            <span className="flex items-center">
                              <span className="px-2 py-1 bg-white/10 rounded-lg text-xs">
                                {transaction.category}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                    ? t('noTransactionsFound') 
                    : t('noTransactionsRecorded')
                  }
                </h3>
                <p className="text-gray-300 mb-6">
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                    ? t('adjustFilters')
                    : 'Start by adding funds or recording expenses from the dashboard.'
                  }
                </p>
                <div className="flex space-x-3 justify-center">
                  {(searchTerm || filterType !== 'all' || filterCategory !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl px-6 py-3 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>{t('clearFilters')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/${locale}/dashboard`)}
                    className="bg-white/10 backdrop-blur-sm text-white rounded-xl px-6 py-3 hover:bg-white/20 transition-all border border-white/20"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

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
} 