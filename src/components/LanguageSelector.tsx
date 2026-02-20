'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile } from '@/services/authService';
import { setUserLocale } from '@/i18n/locale';
import { logger } from '@/lib/logger';
import { ChevronDown } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languages');
  const { user, userProfile, setUserProfile } = useAuthStore();

  const languages = [
    { code: 'en', name: t('en') },
    { code: 'fr', name: t('fr') },
    { code: 'ar', name: t('ar') },
  ];

  const handleLanguageChange = async (newLocale: string) => {
    // Set the user's locale preference in cookie
    setUserLocale(newLocale as 'en' | 'fr' | 'ar');
    
    // Update user's preferred language in their profile if they're logged in
    if (user && userProfile) {
      try {
        await updateUserProfile(user.uid, { preferredLanguage: newLocale });
        setUserProfile({ ...userProfile, preferredLanguage: newLocale });
      } catch (error) {
        logger.error('Error updating preferred language', { error });
      }
    }
    
    // Navigate to the same page with the new locale
    // pathname is like "/fr" or "/fr/dashboard", we need to replace the first part
    const pathSegments = pathname.split('/').filter(Boolean);
    const currentPath = pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : '';
    const targetUrl = `/${newLocale}${currentPath}`;
    
    router.push(targetUrl);
  };

  return (
    <div className="relative">
      <div className="relative">
        <select
          value={locale}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="appearance-none bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors cursor-pointer hover:bg-slate-50"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code} className="text-slate-900">
              {language.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default LanguageSelector; 
