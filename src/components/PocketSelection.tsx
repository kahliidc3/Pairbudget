'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [loadingPocketId, setLoadingPocketId] = useState<string | null>(null);

  // Memoize pocket IDs to prevent unnecessary re-fetches
  const pocketIds = useMemo(() => userProfile?.pocketIds || [], [userProfile?.pocketIds]);

  // Load all user's pockets with better caching
  useEffect(() => {
    let isMounted = true;

    const loadUserPockets = async () => {
      if (pocketIds.length === 0) {
        setUserPockets([]);
        setLoading(false);
        return;
      }

      try {
        // Load pockets with timeout for better UX
        const pocketPromises = pocketIds.map(async (pocketId) => {
          try {
            const pocket = await Promise.race([
              getPocket(pocketId),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
              )
            ]) as Pocket | null;
            return pocket;
          } catch (error) {
            console.warn(`Failed to load pocket ${pocketId}:`, error);
            return null;
          }
        });
        
        const pockets = await Promise.all(pocketPromises);
        
        if (!isMounted) return;
        
        // Filter out null values (pockets that couldn't be loaded)
        const validPockets = pockets.filter((pocket): pocket is Pocket => pocket !== null);
        setUserPockets(validPockets);
      } catch (error) {
        console.error('Error loading user pockets:', error);
        if (isMounted) {
          setUserPockets([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserPockets();

    return () => {
      isMounted = false;
    };
  }, [pocketIds]);

  const handlePocketSelect = useCallback(async (pocket: Pocket) => {
    if (!user || !userProfile || loadingPocketId) return;

    setLoadingPocketId(pocket.id);

    try {
      // Update user's current pocket
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      
      // Update current pocket in store
      setCurrentPocket(pocket);
    } catch (error) {
      console.error('Error selecting pocket:', error);
    } finally {
      setLoadingPocketId(null);
    }
  }, [user, userProfile, setUserProfile, setCurrentPocket, loadingPocketId]);

  if (showCreateNew) {
    return <PocketSetup isModal={false} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"
          animate={{ 
            y: [0, -20, 0], 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-lg"
          animate={{ 
            y: [0, 15, 0], 
            x: [0, 10, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-white text-lg">PairBudget</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white/70 hidden md:block">
                Welcome, {userProfile?.name || user?.email?.split('@')[0]}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="min-h-screen flex items-center justify-center px-4 py-24 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              Choose Your Pocket
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/70 max-w-2xl mx-auto"
            >
              You have {userPockets.length} pocket{userPockets.length !== 1 ? 's' : ''} available. 
              Select one to continue managing your budget.
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mx-auto mb-4"></div>
              <p className="text-white/70">Loading your pockets...</p>
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
                    disabled={loadingPocketId === pocket.id}
                    className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-left hover:bg-white/15 transition-all duration-300 group relative hover:-translate-y-1 shadow-xl ${
                      loadingPocketId === pocket.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        {loadingPocketId === pocket.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <Wallet className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2">{pocket.name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Balance</span>
                        <span className={`font-medium ${pocket.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(pocket.balance)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Members</span>
                        <span className="flex items-center space-x-1 text-white">
                          <Users className="w-3 h-3" />
                          <span>{pocket.participants.length}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-white/60">
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
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Pocket</span>
                </button>
                <p className="text-sm text-white/60 mt-3">
                  Want to start fresh? Create a new pocket for different budgets.
                </p>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PocketSelection; 