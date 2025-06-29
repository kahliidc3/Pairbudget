'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { getPocket } from '@/services/pocketService';
import { updateUserProfile } from '@/services/authService';
import { formatCurrency } from '@/lib/utils';
import { 
  ChevronDown, 
  Plus, 
  Wallet,
  Users,
  TrendingUp
} from 'lucide-react';
import { Pocket } from '@/types';

interface PocketSelectorProps {
  onCreateNew: () => void;
}

const PocketSelector: React.FC<PocketSelectorProps> = ({ onCreateNew }) => {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const { currentPocket, setCurrentPocket } = usePocketStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userPockets, setUserPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all user's pockets
  useEffect(() => {
    const loadUserPockets = async () => {
      if (!userProfile?.pocketIds || userProfile.pocketIds.length === 0) {
        setUserPockets([]);
        return;
      }

      setLoading(true);
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

  const handlePocketSwitch = async (pocket: Pocket) => {
    if (!user || !userProfile) return;

    try {
      // Update user's current pocket
      await updateUserProfile(user.uid, { currentPocketId: pocket.id });
      setUserProfile({ ...userProfile, currentPocketId: pocket.id });
      
      // Update current pocket in store
      setCurrentPocket(pocket);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error switching pocket:', error);
    }
  };

  if (!userProfile?.pocketIds || userProfile.pocketIds.length === 0) {
    return (
      <div className="relative">
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          <span>Create Pocket</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-white/90 transition-all duration-300 min-w-[200px]"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-800 truncate">
            {currentPocket?.name || 'Select Pocket'}
          </div>
          {currentPocket && (
            <div className="text-xs text-gray-500">
              {formatCurrency(currentPocket.balance)}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wide">
                Your Pockets
              </div>
              
              {loading ? (
                <div className="px-3 py-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {userPockets.map((pocket) => (
                    <button
                      key={pocket.id}
                      onClick={() => handlePocketSwitch(pocket)}
                      className={`w-full px-3 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                        currentPocket?.id === pocket.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{pocket.name}</div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{pocket.participants.length}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span className={pocket.balance >= 0 ? 'text-green-600' : 'text-red-500'}>
                                {formatCurrency(pocket.balance)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onCreateNew();
                  }}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Pocket</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PocketSelector; 