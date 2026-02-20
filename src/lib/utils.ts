import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logger } from './logger';

const SECURE_INVITE_HOSTS = ['localhost', '127.0.0.1', '::1'];
const STORAGE_KEYS = [
  'firebase:authUser',
  'firebase:host',
  'firebaseui::rememberedAccounts',
  'firebase:previous_websocket_failure',
  'firebase:persistence',
  'firebase:persistenceKey',
  'firebase-error-cache',
];
const SESSION_ONLY_KEYS = ['firebase:redirect'];
const COOKIE_KEYS = [
  '__session',
  'firebase-auth',
  'firebase-auth-remember-me',
  'firebase_local_storage',
];
const INDEXED_DB_DATABASES = ['firebaseLocalStorageDb'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormatCurrencyOptions {
  locale?: string;
  currency?: string;
}

const getResolvedLocale = (locale?: string) => {
  if (locale) return locale;
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-US';
};

const normalizeCurrencyCode = (currency?: string) => {
  const fallback = 'MAD';
  if (!currency) return fallback;
  const upper = currency.toUpperCase();
  if (upper === 'USD') return 'MAD';
  return /^[A-Z]{3}$/.test(upper) ? upper : fallback;
};

export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}): string {
  const locale = getResolvedLocale(options.locale);
  const currency = normalizeCurrencyCode(options.currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(getResolvedLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const ensureHttps = (url: URL) => {
  if (url.protocol === 'http:' && !SECURE_INVITE_HOSTS.includes(url.hostname)) {
    url.protocol = 'https:';
  }
};

export function generateInviteLink(inviteCode: string, locale?: string): string {
  const localeSegment = (() => {
    if (locale && ['en', 'fr', 'ar'].includes(locale)) return locale;
    if (typeof window === 'undefined') return 'en';
    const segment = window.location.pathname.split('/').filter(Boolean)[0];
    return ['en', 'fr', 'ar'].includes(segment) ? segment : 'en';
  })();
  const fallback = `/${localeSegment}/join?code=${encodeURIComponent(inviteCode)}`;
  const envBase = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : undefined;
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : envBase;

  if (!baseOrigin) {
    return fallback;
  }

  try {
    const url = new URL(baseOrigin);
    ensureHttps(url);
    url.pathname = `/${localeSegment}/join`;
    url.search = `code=${encodeURIComponent(inviteCode)}`;
    url.hash = '';
    return url.toString();
  } catch (error) {
    logger.warn('Failed to generate invite link from base origin, falling back.', { error, context: { baseOrigin } });
    return fallback;
  }
}

export function clearAuthCache() {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    logger.debug('Clearing Firebase auth cache');

    STORAGE_KEYS.forEach((key) => {
      window.localStorage?.removeItem(key);
      window.sessionStorage?.removeItem(key);
    });

    SESSION_ONLY_KEYS.forEach((key) => {
      window.sessionStorage?.removeItem(key);
    });

    if ('indexedDB' in window) {
      INDEXED_DB_DATABASES.forEach((dbName) => {
        try {
          window.indexedDB.deleteDatabase(dbName);
        } catch (indexedDbError) {
          logger.warn('Unable to delete IndexedDB cache', { error: indexedDbError, context: { dbName } });
        }
      });
    }

    if (typeof document !== 'undefined' && document.cookie) {
      COOKIE_KEYS.forEach((name) => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
      });
    }

    logger.debug('Firebase auth cache cleared');
  } catch (error) {
    logger.error('Error during auth cache clearing', { error });
  }
}
