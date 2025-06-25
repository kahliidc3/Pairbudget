'use client';

import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile, updateUserProfile } from '@/services/authService';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          
          // Migration: Handle existing users who don't have pocketIds
          if (userProfile && !userProfile.pocketIds) {
            const migratedProfile = { 
              ...userProfile, 
              pocketIds: userProfile.currentPocketId ? [userProfile.currentPocketId] : []
            };
            
            // Update the database with the migrated profile
            await updateUserProfile(user.uid, { pocketIds: migratedProfile.pocketIds });
            setUserProfile(migratedProfile);
          } else {
            setUserProfile(userProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading]);

  return <>{children}</>;
};

export default AuthProvider; 