import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations('legal.privacy');
  const tCommon = await getTranslations('common');

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)', padding: '2.5rem 1.5rem' }}>
      <div className="card card-padded" style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 className="t-display" style={{ fontSize: '1.85rem' }}>{t('title')}</h1>
        <p style={{ marginTop: '.5rem', fontSize: '.875rem', color: 'var(--text-muted)' }}>{t('lastUpdated')}</p>
        <p style={{ marginTop: '1rem', color: 'var(--text-mid)', lineHeight: 1.65 }}>{t('intro')}</p>

        <section style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text-mid)' }}>
          <article>
            <h2 className="t-head" style={{ fontSize: '1rem', color: 'var(--text)' }}>{t('dataCollectedTitle')}</h2>
            <p style={{ marginTop: '.4rem', lineHeight: 1.65 }}>{t('dataCollectedBody')}</p>
          </article>
          <article>
            <h2 className="t-head" style={{ fontSize: '1rem', color: 'var(--text)' }}>{t('firebaseTitle')}</h2>
            <p style={{ marginTop: '.4rem', lineHeight: 1.65 }}>{t('firebaseBody')}</p>
          </article>
          <article>
            <h2 className="t-head" style={{ fontSize: '1rem', color: 'var(--text)' }}>{t('cookiesTitle')}</h2>
            <p style={{ marginTop: '.4rem', lineHeight: 1.65 }}>{t('cookiesBody')}</p>
          </article>
          <article>
            <h2 className="t-head" style={{ fontSize: '1rem', color: 'var(--text)' }}>{t('rightsTitle')}</h2>
            <p style={{ marginTop: '.4rem', lineHeight: 1.65 }}>{t('rightsBody')}</p>
          </article>
        </section>

        <div style={{ marginTop: '2rem' }}>
          <Link href={`/${locale}`} className="btn btn-ghost btn-sm">
            ← {tCommon('back')}
          </Link>
        </div>
      </div>
    </main>
  );
}
