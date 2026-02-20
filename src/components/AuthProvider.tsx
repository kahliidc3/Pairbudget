'use client';

import React, { useEffect, useRef } from 'react';
import { signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile, updateUserProfile } from '@/services/authService';
import { APP_LIMITS } from '@/constants/config';
import { setUserLocale } from '@/i18n/locale';
import { clearAuthCache } from '@/lib/utils';
import { logger } from '@/lib/logger';

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
  const orphanedUsersRef = useRef<Set<string>>(new Set());
  const signOutAttemptRef = useRef<boolean>(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    authTimeoutRef.current = setTimeout(() => {
      logger.warn('Authentication timeout - setting loading to false');
      setLoading(false);
    }, APP_LIMITS.authStateTimeoutMs);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clear the timeout since we received an auth state change
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }

      // If we're in the middle of signing out, ignore this auth state change
      if (signOutAttemptRef.current) {
        logger.debug('Ignoring auth state change during sign-out process');
        return;
      }

      setUser(user);
      
      if (user) {
        // Check if this user has already been identified as orphaned
        if (orphanedUsersRef.current.has(user.uid)) {
          logger.warn('Orphaned user detected during re-authentication. Forcing sign out.');
          signOutAttemptRef.current = true;
          
          try {
            clearAuthCache();
            await firebaseSignOut(auth);
            
            // Clear all local state immediately
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            
            // Delayed cleanup to prevent redirect conflicts
                         cleanupTimeoutRef.current = setTimeout(() => {
               if (pathname.includes('/dashboard')) {
                 router.replace(`/${currentLocale}?auth=login`);
               } else {
                 router.replace(`/${currentLocale}?auth=login`);
               }
             }, APP_LIMITS.orphanedReauthRedirectDelayMs);
          } catch (error) {
            logger.error('Error force signing out orphaned user', { error });
            // Fallback: redirect to home
            router.replace(`/${currentLocale}`);
          } finally {
            signOutAttemptRef.current = false;
          }
          return;
        }

        try {
          const userProfile = await getUserProfile(user.uid);
          
          // If user exists in Firebase Auth but not in our database, sign them out
          if (!userProfile) {
            logger.warn('Authenticated user missing profile record. Signing out.');
            
            // Mark this user as orphaned to prevent re-authentication loops
            orphanedUsersRef.current.add(user.uid);
            signOutAttemptRef.current = true;
            
            try {
              clearAuthCache();
              await firebaseSignOut(auth);
              
              // Clear all local state immediately
              setUser(null);
              setUserProfile(null);
              setLoading(false);
              
              // Graceful redirect without immediate reload
                             cleanupTimeoutRef.current = setTimeout(() => {
                 logger.debug('Redirecting orphaned user to login');
                 if (pathname.includes('/dashboard')) {
                   router.replace(`/${currentLocale}?auth=login`);
                 } else {
                   router.replace(`/${currentLocale}?auth=login`);
                 }
               }, APP_LIMITS.orphanedRedirectDelayMs);
            } catch (signOutError) {
              logger.error('Error signing out orphaned user', { error: signOutError });
              // Fallback: redirect to login
              router.replace(`/${currentLocale}?auth=login`);
            } finally {
              signOutAttemptRef.current = false;
            }
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
              logger.error('Error migrating user profile', { error: migrationError });
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
          logger.error('Error fetching user profile', { error });
          // If there's an error fetching profile, treat as orphaned user
          orphanedUsersRef.current.add(user.uid);
          signOutAttemptRef.current = true;
          
          try {
            clearAuthCache();
            await firebaseSignOut(auth);
            setUser(null);
            setUserProfile(null);
            
                         cleanupTimeoutRef.current = setTimeout(() => {
               router.replace(`/${currentLocale}?auth=login`);
             }, APP_LIMITS.orphanedRedirectDelayMs);
          } catch (signOutError) {
            logger.error('Error signing out after profile fetch error', { error: signOutError });
              router.replace(`/${currentLocale}?auth=login`);
            } finally {
            signOutAttemptRef.current = false;
          }
        }
      } else {
        setUserProfile(null);
        // Reset redirect flag when user signs out
        hasRedirectedRef.current = false;
        // Clear orphaned users list when successfully signed out
        orphanedUsersRef.current.clear();
        signOutAttemptRef.current = false;
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [setUser, setUserProfile, setLoading, router, pathname, currentLocale]);

  return <>{children}</>;
};

export default AuthProvider; 
