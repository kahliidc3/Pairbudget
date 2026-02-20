import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations('legal.terms');
  const tCommon = await getTranslations('common');

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('lastUpdated')}</p>
        <p className="mt-4 text-gray-700">{t('intro')}</p>

        <section className="mt-6 space-y-5 text-gray-700">
          <article>
            <h2 className="font-semibold text-gray-900">{t('acceptableUseTitle')}</h2>
            <p className="mt-1">{t('acceptableUseBody')}</p>
          </article>
          <article>
            <h2 className="font-semibold text-gray-900">{t('dataRetentionTitle')}</h2>
            <p className="mt-1">{t('dataRetentionBody')}</p>
          </article>
          <article>
            <h2 className="font-semibold text-gray-900">{t('liabilityTitle')}</h2>
            <p className="mt-1">{t('liabilityBody')}</p>
          </article>
          <article>
            <h2 className="font-semibold text-gray-900">{t('contactTitle')}</h2>
            <p className="mt-1">{t('contactBody')}</p>
          </article>
        </section>

        <div className="mt-8">
          <Link href={`/${locale}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            {tCommon('back')}
          </Link>
        </div>
      </div>
    </main>
  );
}
