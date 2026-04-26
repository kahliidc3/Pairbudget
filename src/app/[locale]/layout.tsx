import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LocaleProvider from '@/components/LocaleProvider';
import AuthProvider from '@/components/AuthProvider';

const locales = ['en', 'fr', 'ar'];

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
} 