import { cookies } from 'next/headers';

export type Locale = 'en' | 'fr' | 'ar';

const defaultLocale: Locale = 'en';

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get('locale')?.value as Locale) ?? defaultLocale;
} 