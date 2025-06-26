'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { setUserLocale } from '@/i18n/locale';

const LanguageSelector: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languages');

  const languages = [
    { code: 'en', name: t('en') },
    { code: 'fr', name: t('fr') },
    { code: 'ar', name: t('ar') },
  ];

  const handleLanguageChange = (newLocale: string) => {
    // Set the user's locale preference in cookie
    setUserLocale(newLocale as 'en' | 'fr' | 'ar');
    
    // Navigate to the same page with the new locale
    // pathname is like "/fr" or "/fr/dashboard", we need to replace the first part
    const pathSegments = pathname.split('/').filter(Boolean);
    const currentPath = pathSegments.length > 1 ? '/' + pathSegments.slice(1).join('/') : '';
    const targetUrl = `/${newLocale}${currentPath}`;
    
    router.push(targetUrl);
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="btn-ghost text-sm px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 rtl:text-right"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector; 