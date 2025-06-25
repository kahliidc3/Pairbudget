import {cookies} from 'next/headers';

export type Locale = 'en' | 'fr' | 'ar';

const defaultLocale: Locale = 'en';

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get('locale')?.value as Locale) ?? defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set('locale', locale);
} 