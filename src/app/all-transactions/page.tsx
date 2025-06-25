'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  Wallet,
  Download,
  Receipt
} from 'lucide-react';
import { Transaction } from '@/types';

interface TransactionWithUser extends Transaction {
  userName?: string;
}

export default function AllTransactionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentPocket, transactions } = usePocketStore();
  const [transactionsWithUsers, setTransactionsWithUsers] = useState<TransactionWithUser[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fund' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  if (!user || !currentPocket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card-floating animate-scale-in p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Loading transactions...</p>
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
        className="glass-nav fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl"
      >
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">All Transactions</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 hidden md:block">
              {currentPocket.name}
            </span>
            <button
              onClick={handleExport}
              className="p-2 text-gray-500 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto pt-24 space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Transaction History</h1>
          <p className="text-gray-600">
            Complete history of all transactions in {currentPocket.name}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-floating"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'fund' | 'expense')}
              className="input-glass w-full"
            >
              <option value="all">All Types</option>
              <option value="fund">Funds Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-glass w-full"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-600">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-floating"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transaction details...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'fund' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {transaction.type === 'fund' ? (
                          <ArrowUpRight className="w-6 h-6" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {transaction.description}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.type === 'fund'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{transaction.userName}</span>
                          </span>
                          <span>{transaction.category}</span>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`text-xl font-bold ${
                      transaction.type === 'fund' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {transaction.type === 'fund' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No transactions have been recorded yet.'}
              </p>
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterCategory('all');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => router.back()}
                  className="btn-primary"
                >
                  Go Back to Dashboard
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 