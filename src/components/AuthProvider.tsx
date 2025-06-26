'use client';

import React, { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile, updateUserProfile, signOut } from '@/services/authService';
import { setUserLocale } from '@/i18n/locale';
import { clearAuthCache } from '@/lib/utils';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setUserProfile, setLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const hasRedirectedRef = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    authTimeoutRef.current = setTimeout(() => {
      console.warn('Authentication timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clear the timeout since we received an auth state change
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }

      setUser(user);
      
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          
          // If user exists in Firebase Auth but not in our database, sign them out
          if (!userProfile) {
            console.warn(`User ${user.uid} exists in Firebase Auth but not in database. Signing out...`);
            clearAuthCache(); // Clear cached auth data
            await signOut();
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          // Migration: Handle existing users who don't have pocketIds
          if (userProfile && !userProfile.pocketIds) {
            const migratedProfile = { 
              ...userProfile, 
              pocketIds: userProfile.currentPocketId ? [userProfile.currentPocketId] : []
            };
            
            // Update the database with the migrated profile
            try {
              await updateUserProfile(user.uid, { pocketIds: migratedProfile.pocketIds });
              setUserProfile(migratedProfile);
            } catch (migrationError) {
              console.error('Error migrating user profile:', migrationError);
              // If migration fails, still set the profile to prevent loading loop
              setUserProfile(userProfile);
            }
          } else {
            setUserProfile(userProfile);
          }

          // Handle preferred language redirect - only on initial login
          if (userProfile?.preferredLanguage && 
              userProfile.preferredLanguage !== currentLocale && 
              !hasRedirectedRef.current) {
            
            const preferredLanguage = userProfile.preferredLanguage;
            
            // Set the user's locale preference in cookie
            setUserLocale(preferredLanguage as 'en' | 'fr' | 'ar');
            
            // Navigate to the same page with the user's preferred locale
            const pathSegments = pathname.split('/').filter(Boolean);
            const currentPath = pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : '';
            const targetUrl = `/${preferredLanguage}${currentPath}`;
            
            // Only redirect if we're not already on the preferred language
            if (pathname !== targetUrl) {
              hasRedirectedRef.current = true;
              router.replace(targetUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If there's an error fetching profile, sign out the user to prevent loading loop
          try {
            clearAuthCache(); // Clear cached auth data
            await signOut();
            setUser(null);
            setUserProfile(null);
          } catch (signOutError) {
            console.error('Error signing out after profile fetch error:', signOutError);
          }
        }
      } else {
        setUserProfile(null);
        // Reset redirect flag when user signs out
        hasRedirectedRef.current = false;
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [setUser, setUserProfile, setLoading, router, pathname, currentLocale]);

  return <>{children}</>;
};

export default AuthProvider; 