import { redirect } from 'next/navigation';
import { getUserLocale } from '@/i18n/locale';

export default async function RootPage() {
  // Get the user's preferred locale
  const locale = await getUserLocale();
  
  // Redirect to the appropriate locale
  redirect(`/${locale}`);
}
