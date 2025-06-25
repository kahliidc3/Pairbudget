'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserLocale } from '@/i18n/locale';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the user's preferred locale
    const locale = getUserLocale();
    
    // Redirect to the appropriate locale
    router.push(`/${locale}`);
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black">
      <div className="text-purple-200 text-lg">Loading...</div>
    </div>
  );
}
