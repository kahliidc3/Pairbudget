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
        console.warn('Error cleaning up pocket subscription:', error);
      }
    }
    if (unsubscribeRefs.current.transactions) {
      try {
        unsubscribeRefs.current.transactions();
      } catch (error) {
        console.warn('Error cleaning up transactions subscription:', error);
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
    if (!userStatus.isAuthenticated) {
      router.push(`/${locale}`);
      return;
    }
  }, [userStatus.isAuthenticated, router, locale]);

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
        console.error('Error setting up subscriptions:', error);
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
        console.warn('Error during global subscription cleanup:', error);
      }
    };
  }, []);

  // Optimized loading conditions - only show loading when truly necessary
  const shouldShowLoading = authLoading || 
                           !userStatus.isAuthenticated || 
                           (!initialLoadComplete && userStatus.hasProfile && userStatus.currentPocketId);

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400 relative overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full" style={{
            animation: 'float 20s ease-in-out infinite'
          }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full" style={{
            animation: 'float 25s ease-in-out infinite reverse'
          }}></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full" style={{
            animation: 'float 15s ease-in-out infinite'
          }}></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-full" style={{
            animation: 'float 18s ease-in-out infinite reverse'
          }}></div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md w-full mx-4 shadow-xl relative z-10">
          <LoadingSpinner 
            size="lg" 
            className="mb-6" 
            showProgress={true}
            text={authLoading ? 'Authenticating...' : 
                  !userStatus.isAuthenticated ? 'Redirecting to login...' : 
                  'Loading your budget...'}
          />
          <div className="mt-4 text-sm text-gray-300">
            {authLoading ? 'Verifying your credentials...' :
             !userStatus.isAuthenticated ? 'Please wait while we redirect you...' :
             'Setting up your financial dashboard...'}
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(5deg); }
            50% { transform: translateY(-10px) rotate(0deg); }
            75% { transform: translateY(-30px) rotate(-5deg); }
          }
        `}</style>
      </div>
    );
  }

  // Check user state
  const hasNoPockets = !userStatus.hasPockets;
  const hasNoCurrentPocket = !currentPocket && userStatus.hasPockets;



  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {hasNoPockets ? (
          <div className="min-h-screen flex items-center justify-center p-4">
            <PocketSetup />
          </div>
        ) : hasNoCurrentPocket ? (
            <PocketSelection />
        ) : (
          <Dashboard />
        )}
      </div>
    </ErrorBoundary>
  );
} 