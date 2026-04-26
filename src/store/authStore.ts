import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types';

interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userProfile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, userProfile: null, loading: false }),
  reset: () => set({ user: null, userProfile: null, loading: true }),
})); 