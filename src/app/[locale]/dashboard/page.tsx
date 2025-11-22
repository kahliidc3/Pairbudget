'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { subscribeToPocket, subscribeToTransactions, cleanupAllSubscriptions } from '@/services/pocketService';
import LoadingSpinner from '@/components/LoadingSpinner';
import PocketSetup from '@/components/PocketSetup';
import PocketSelection from '@/components/PocketSelection';
import Dashboard from '@/components/Dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuthStore();
  const { currentPocket, setCurrentPocket, setTransactions, clearPocketData } = usePocketStore();

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  
  // Use refs to track cleanup functions and prevent race conditions
  const unsubscribeRefs = useRef<{
    pocket?: () => void;
    transactions?: () => void;
  }>({});
  const mountedRef = useRef(true);
  const subscriptionSetupRef = useRef(false);

  // Memoize user status to prevent unnecessary re-renders
  const userStatus = useMemo(() => ({
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    currentPocketId: userProfile?.currentPocketId,
    hasPockets: userProfile?.pocketIds && userProfile.pocketIds.length > 0
  }), [user, userProfile]);

  // Optimize cleanup function
  const cleanupSubscriptions = useCallback(() => {
    if (unsubscribeRefs.current.pocket) {
      try {
        unsubscribeRefs.current.pocket();
      } catch (error) {
        logger.warn('Error cleaning up pocket subscription', { error });
      }
    }
    if (unsubscribeRefs.current.transactions) {
      try {
        unsubscribeRefs.current.transactions();
      } catch (error) {
        logger.warn('Error cleaning up transactions subscription', { error });
      }
    }
    unsubscribeRefs.current = {};
    subscriptionSetupRef.current = false;
  }, []);

  // Clear any corrupted state on mount
  useEffect(() => {
    mountedRef.current = true;
    clearPocketData();
    
    // Clean up any existing subscriptions on mount
    return () => {
      mountedRef.current = false;
      cleanupSubscriptions();
    };
  }, [clearPocketData, cleanupSubscriptions]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !userStatus.isAuthenticated) {
      // Immediate redirect for unauthenticated users
      const timeoutId = setTimeout(() => {
        router.replace(`/${locale}`);
      }, 100); // Very short delay to prevent race conditions

      return () => clearTimeout(timeoutId);
    }
  }, [userStatus.isAuthenticated, authLoading, router, locale]);

  // Setup subscriptions with optimized logic
  useEffect(() => {
    // Fast return for unauthenticated users or missing profile
    if (!userStatus.isAuthenticated || !userStatus.hasProfile) {
      setInitialLoadComplete(true);
      return;
    }

    const currentPocketId = userStatus.currentPocketId;
    
    // If no current pocket, clear state and mark as loaded
    if (!currentPocketId) {
      setCurrentPocket(null);
      setTransactions([]);
      setInitialLoadComplete(true);
      return;
    }

    // Prevent duplicate subscriptions
    if (subscriptionSetupRef.current && currentPocket?.id === currentPocketId) {
      setInitialLoadComplete(true);
      return;
    }

    // Cleanup existing subscriptions
    cleanupSubscriptions();
    subscriptionSetupRef.current = true;
    
    // Setup subscriptions with better error handling
    const setupSubscriptions = async () => {
      try {
        // Set up pocket subscription
        unsubscribeRefs.current.pocket = subscribeToPocket(currentPocketId, (pocket) => {
          if (!mountedRef.current) return;
          
          setCurrentPocket(pocket);
          setInitialLoadComplete(true);
          
          if (!pocket) {
            setTransactions([]);
          }
        });

        // Set up transactions subscription
        unsubscribeRefs.current.transactions = subscribeToTransactions(currentPocketId, (transactions) => {
          if (!mountedRef.current) return;
          setTransactions(transactions);
        });

        // Set a timeout to ensure we don't wait forever
        setTimeout(() => {
          if (!initialLoadComplete) {
            setInitialLoadComplete(true);
          }
        }, 2000); // 2-second timeout for faster loading

      } catch (error) {
        logger.error('Error setting up subscriptions', { error });
        setInitialLoadComplete(true);
        setCurrentPocket(null);
        setTransactions([]);
      }
    };

    setupSubscriptions();
    
    return cleanupSubscriptions;
  }, [userStatus, setCurrentPocket, setTransactions, currentPocket?.id, cleanupSubscriptions, initialLoadComplete]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      // Final cleanup when component is about to unmount
      try {
        cleanupAllSubscriptions();
      } catch (error) {
        logger.warn('Error during global subscription cleanup', { error });
      }
    };
  }, []);

  // Optimized loading conditions - only show loading when truly necessary
  const shouldShowLoading = authLoading || 
                           (!initialLoadComplete && userStatus.hasProfile && userStatus.currentPocketId);

  // Show loading only for authenticated users with valid profiles
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md w-full mx-4 shadow-sm">
          <LoadingSpinner 
            size="lg" 
            className="mb-6" 
            showProgress={true}
            text={authLoading ? 'Authenticating...' : 'Loading your budget...'}
          />
          <div className="mt-4 text-sm text-slate-600 font-medium">
            {authLoading ? 'Verifying your credentials...' : 'Setting up your financial dashboard...'}
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthenticated users - this should be very brief due to the redirect
  if (!userStatus.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md w-full mx-4 shadow-sm">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-slate-600 font-medium mb-2">Redirecting...</p>
          <p className="text-slate-500 text-sm">Taking you back to the login page</p>
        </div>
      </div>
    );
  }

  // Check user state
  const hasNoPockets = !userStatus.hasPockets;
  const hasNoCurrentPocket = !currentPocket && userStatus.hasPockets;

  return (
    <ErrorBoundary>
      {hasNoPockets ? (
        <PocketSetup isModal={false} />
      ) : hasNoCurrentPocket ? (
        <PocketSelection />
      ) : (
        <Dashboard />
      )}
    </ErrorBoundary>
  );
} 
