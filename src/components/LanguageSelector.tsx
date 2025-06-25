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

  const handleLanguageChange = async (newLocale: string) => {
    // Set the user's locale preference in cookie
    await setUserLocale(newLocale as any);
    
    // Navigate to the same page with the new locale
    const currentPath = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${currentPath}`);
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="btn-ghost text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 bg-transparent border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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