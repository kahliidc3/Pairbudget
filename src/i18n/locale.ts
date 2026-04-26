export type Locale = 'en' | 'fr' | 'ar';

const defaultLocale: Locale = 'en';

// Client-side cookie management
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function getUserLocale(): Locale {
  const locale = getCookie('locale');
  return (locale as Locale) ?? defaultLocale;
}

export function setUserLocale(locale: Locale) {
  setCookie('locale', locale);
} 