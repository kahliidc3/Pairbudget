'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { getPocket } from '@/services/pocketService';
import { updateUserProfile } from '@/services/authService';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  Wallet,
  Users,
  TrendingUp,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { Pocket } from '@/types';
import PocketSetup from '@/components/PocketSetup';

const PocketSelection: React.FC = () => {
  const { user, userProfile, setUserProfile, signOut } = useAuthStore();
  const { setCurrentPocket } = usePocketStore();
  const [userPockets, setUserPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);

  // Load all user's pockets
  useEffect(() => {
    const loadUserPockets = async () => {
      if (!userProfile?.pocketIds || userProfile.pocketIds.length === 0) {
        setUserPockets([]);
        setLoading(false);
        return;
      }

      try {
        const pockets = await Promise.all(
          userProfile.pocketIds.map(async (pocketId) => {
            const pocket = await getPocket(pocketId);
            return pocket;
          })
        );
        
        // Filter out null values (pockets that couldn't be loaded)
        const validPockets = pockets.filter((pocket): pocket is Pocket => pocket !== null);
        setUserPockets(validPockets);
      } catch (error) {
        console.error('Error loading user pockets:', error);
        setUserPockets([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserPockets();
  }, [userProfile?.pocketIds]);

  const handlePocketSelect = async (pocket: Pocket) => {
    if (!user || !userProfile) return;

    try {
      // Update user's current pocket
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      
      // Update current pocket in store
      setCurrentPocket(pocket);
    } catch (error) {
      console.error('Error selecting pocket:', error);
    }
  };

  if (showCreateNew) {
    return <PocketSetup />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-nav fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-between w-full max-w-4xl mx-auto px-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-800">PairBudget</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 hidden md:block">
            Welcome, {userProfile?.name || user?.email?.split('@')[0]}
          </span>
          <button
            onClick={signOut}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      <div className="w-full max-w-4xl mx-auto pt-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Choose Your Pocket
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You have {userPockets.length} pocket{userPockets.length !== 1 ? 's' : ''} available. 
              Select one to continue managing your budget.
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your pockets...</p>
            </div>
          ) : (
            <>
              {/* Pockets Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
              >
                {userPockets.map((pocket, index) => (
                  <motion.button
                    key={pocket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => handlePocketSelect(pocket)}
                    className="card-floating p-6 text-left hover:scale-105 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{pocket.name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Balance</span>
                        <span className={`font-medium ${pocket.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatCurrency(pocket.balance)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Members</span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{pocket.participants.length}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Funded: {formatCurrency(pocket.totalFunded)}</span>
                      </span>
                      <span>Spent: {formatCurrency(pocket.totalSpent)}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* Create New Pocket */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <button
                  onClick={() => setShowCreateNew(true)}
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Pocket</span>
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Want to start fresh? Create a new pocket for different budgets.
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PocketSelection; 