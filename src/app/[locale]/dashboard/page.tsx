'use client';

import React, { useEffect, useState, useRef } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePocketStore } from '@/store/pocketStore';
import { subscribeToPocket, subscribeToTransactions, cleanupAllSubscriptions } from '@/services/pocketService';
import LoadingSpinner from '@/components/LoadingSpinner';
import PocketSetup from '@/components/PocketSetup';
import PocketSelection from '@/components/PocketSelection';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuthStore();
  const { currentPocket, setCurrentPocket, setTransactions, clearPocketData } = usePocketStore();
  const [pocketLoading, setPocketLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const router = useRouter();
  
  // Use refs to track cleanup functions and prevent race conditions
  const unsubscribeRefs = useRef<{
    pocket?: () => void;
    transactions?: () => void;
  }>({});
  const mountedRef = useRef(true);

  // Clear any corrupted state on mount
  useEffect(() => {
    mountedRef.current = true;
    clearPocketData();
    
    // Clean up any existing subscriptions on mount
    return () => {
      mountedRef.current = false;
      
      // Clean up individual subscriptions
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
      
      // Clear refs
      unsubscribeRefs.current = {};
    };
  }, [clearPocketData]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Don't proceed if still loading user profile
    if (!userProfile) {
      return;
    }

    // Only proceed if we have a current pocket ID and it's different from what we're already subscribed to
    const currentPocketId = userProfile.currentPocketId;
    
    if (!currentPocketId) {
      // No current pocket, clear everything
      setCurrentPocket(null);
      setTransactions([]);
      setPocketLoading(false);
      return;
    }

    // Check if we're already subscribed to this pocket AND have active subscriptions
    const isAlreadySubscribed = currentPocket?.id === currentPocketId && 
                               unsubscribeRefs.current.pocket && 
                               unsubscribeRefs.current.transactions;
    
    if (isAlreadySubscribed) {
      // Already subscribed to the correct pocket with active subscriptions, no need to resubscribe
      return;
    }

    // Clean up any existing subscriptions before creating new ones
    const cleanupExisting = () => {
      if (unsubscribeRefs.current.pocket) {
        try {
          unsubscribeRefs.current.pocket();
        } catch (error) {
          console.warn('Error cleaning up existing pocket subscription:', error);
        }
      }
      if (unsubscribeRefs.current.transactions) {
        try {
          unsubscribeRefs.current.transactions();
        } catch (error) {
          console.warn('Error cleaning up existing transactions subscription:', error);
        }
      }
      unsubscribeRefs.current = {};
    };

    cleanupExisting();
    setPocketLoading(true);
    
    // Subscribe to pocket with proper cleanup
    try {
      unsubscribeRefs.current.pocket = subscribeToPocket(currentPocketId, (pocket) => {
        if (!mountedRef.current) return; // Ignore if component unmounted
        
        setCurrentPocket(pocket);
        setPocketLoading(false);
        
        // If pocket is null (user was removed or doesn't have access), clear the data
        if (!pocket) {
          setTransactions([]);
        }
      });

      unsubscribeRefs.current.transactions = subscribeToTransactions(currentPocketId, (transactions) => {
        if (!mountedRef.current) return; // Ignore if component unmounted
        setTransactions(transactions);
      });
    } catch (error) {
      console.error('Error setting up subscriptions:', error);
      setPocketLoading(false);
      setCurrentPocket(null);
      setTransactions([]);
    }

    // Cleanup function for this effect
    return cleanupExisting;
  }, [user, userProfile, router, setCurrentPocket, setTransactions, currentPocket?.id]);

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

  // Show loading spinner only when absolutely necessary
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card animate-scale-in text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading your budget...</p>
        </div>
      </div>
    );
  }

  // Show loading only if we're waiting for user profile or initial pocket load
  if (!userProfile || (userProfile.currentPocketId && pocketLoading && !currentPocket)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card animate-scale-in text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading your budget...</p>
        </div>
      </div>
    );
  }

    // Check if user has no pockets at all vs just no current pocket selected
  const hasNoPockets = !userProfile?.pocketIds || userProfile.pocketIds.length === 0;
  const hasNoCurrentPocket = !currentPocket && !hasNoPockets;

  // If user wants to create a new pocket, show the setup
  if (showCreateNew) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PocketSetup />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {hasNoPockets ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <PocketSetup />
        </div>
      ) : hasNoCurrentPocket ? (
          <PocketSelection />
      ) : (
        <Dashboard onCreateNewPocket={() => setShowCreateNew(true)} />
      )}
    </div>
  );
} 