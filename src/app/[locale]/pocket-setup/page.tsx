'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/LoadingSpinner';

const PocketSetup = dynamic(() => import('@/components/PocketSetup'));

export default function PocketSetupPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, loading } = useAuthStore();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <PocketSetup 
      isModal={false}
      onSuccess={() => {
        router.push(`/${locale}/dashboard`);
      }}
    />
  );
} 
