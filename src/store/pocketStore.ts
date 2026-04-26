import { create } from 'zustand';
import { Pocket, Transaction } from '@/types';
import { logger } from '@/lib/logger';

interface PocketState {
  currentPocket: Pocket | null;
  transactions: Transaction[];
  loading: boolean;
  setCurrentPocket: (pocket: Pocket | null) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setLoading: (loading: boolean) => void;
  clearPocketData: () => void;
}

export const usePocketStore = create<PocketState>((set, get) => ({
  currentPocket: null,
  transactions: [],
  loading: false,
  setCurrentPocket: (pocket) => {
    // Safely set current pocket with validation
    try {
      set({ currentPocket: pocket });
    } catch (error) {
      logger.error('Error setting current pocket', { error });
      set({ currentPocket: null });
    }
  },
  setTransactions: (transactions) => {
    // Safely set transactions with validation
    try {
      const validTransactions = Array.isArray(transactions) ? transactions : [];
      set({ transactions: validTransactions });
    } catch (error) {
      logger.error('Error setting transactions', { error });
      set({ transactions: [] });
    }
  },
  addTransaction: (transaction) => {
    try {
      const { transactions } = get();
      if (transaction && typeof transaction === 'object') {
        set({ transactions: [transaction, ...transactions] });
      }
    } catch (error) {
      logger.error('Error adding transaction', { error });
    }
  },
  setLoading: (loading) => set({ loading: Boolean(loading) }),
  clearPocketData: () => {
    try {
      set({ currentPocket: null, transactions: [], loading: false });
    } catch (error) {
      logger.error('Error clearing pocket data', { error });
    }
  },
})); 
