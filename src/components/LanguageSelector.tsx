'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile } from '@/services/authService';
import { setUserLocale } from '@/i18n/locale';
import { logger } from '@/lib/logger';

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
    setUserLocale(newLocale as 'en' | 'fr' | 'ar');
    if (user && userProfile) {
      try {
        await updateUserProfile(user.uid, { preferredLanguage: newLocale });
        setUserProfile({ ...userProfile, preferredLanguage: newLocale });
      } catch (error) {
        logger.error('Error updating preferred language', { error });
      }
    }
    const pathSegments = pathname.split('/').filter(Boolean);
    const currentPath = pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : '';
    router.push(`/${newLocale}${currentPath}`);
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="lang-sel"
      aria-label="Language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>{lang.name}</option>
      ))}
    </select>
  );
};

export default LanguageSelector;
