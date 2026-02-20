'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

interface LocaleProviderProps {
  children: React.ReactNode;
}

const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const locale = useLocale();

  useEffect(() => {
    // Update HTML attributes based on locale
    const html = document.documentElement;
    
    // Only update if different to avoid unnecessary re-renders
    if (html.lang !== locale) {
      html.lang = locale;
    }
    
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    if (html.dir !== direction) {
      html.dir = direction;
    }
    
    // Update body data attribute for locale-specific styling
    const currentLocale = document.body.getAttribute('data-locale');
    if (currentLocale !== locale) {
      document.body.setAttribute('data-locale', locale);
    }
  }, [locale]);

  return <>{children}</>;
};

export default LocaleProvider; 