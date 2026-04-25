'use client';

import React, { useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLocale, useTranslations } from 'next-intl';
import LoadingSpinner from '@/components/LoadingSpinner';
import FirebaseStatus from '@/components/FirebaseStatus';
import LanguageSelector from '@/components/LanguageSelector';
import DebugAuthFix from '@/components/DebugAuthFix';
import { isFirebaseConfigured } from '@/lib/firebase-init';
import { clearAuthCache } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { RefreshCw } from 'lucide-react';

const AuthForm = nextDynamic(() => import('@/components/AuthForm'));

export const dynamic = 'force-dynamic';

const LogoMark: React.FC = () => (
  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
);

export default function HomePage() {
  const { user, loading, setLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showAuth, setShowAuth] = useState(false);

  const t = useTranslations('landing');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setAuthMode(authParam);
      setShowAuth(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) router.push(`/${locale}/dashboard`);
  }, [user, loading, router, locale]);

  const toggleAuthMode = () => {
    setAuthMode(mode => mode === 'login' ? 'signup' : 'login');
  };

  const handleEmergencyReset = async () => {
    try {
      logger.info('Emergency reset initiated');
      clearAuthCache();
      await firebaseSignOut(auth);
    } catch (error) {
      logger.error('Error during emergency reset', { error });
    } finally {
      setTimeout(() => {
        setAuthMode('login');
        setShowAuth(true);
        setLoading(false);
      }, 100);
    }
  };

  if (!isFirebaseConfigured()) {
    return process.env.NODE_ENV === 'development' ? <FirebaseStatus /> : null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="card card-padded text-center max-w-md w-full mx-4">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="font-medium mb-6" style={{ color: 'var(--text-mid)' }}>{tCommon('loading')}</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Taking longer than expected? This might be due to authentication cache issues.
          </p>
          <button onClick={handleEmergencyReset} className="btn btn-red">
            <RefreshCw className="w-4 h-4" />
            Emergency Reset
          </button>
        </div>
      </div>
    );
  }

  if (!user && showAuth) {
    return <AuthForm mode={authMode} onToggleMode={toggleAuthMode} />;
  }

  if (!user) {
    return (
      <>
        {process.env.NODE_ENV === 'development' && <DebugAuthFix />}
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
          <div className="dot-grid" />
          <div className="nav-stripe" />

          {/* Nav */}
          <nav className="nav">
            <div className="nav-logo">
              <div className="nav-mark"><LogoMark /></div>
              <span className="nav-name">{tNav('pairbudget')}</span>
            </div>
            <div className="nav-spacer" />
            <div className="nav-right">
              <LanguageSelector />
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>
                {tNav('signIn')}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>
                {tNav('getStarted')} →
              </button>
            </div>
          </nav>

          {/* Hero */}
          <section className="hero">
            <div>
              <div className="hero-kicker"><span />Shared Finance — Built for Two</div>
              <h1 className="hero-h1">
                {t('heroTitle')}<br />
                <em>{t('heroSubtitle')}</em>
              </h1>
              <p className="hero-p">{t('heroDescription')}</p>
              <div className="hero-actions">
                <button className="btn btn-primary btn-lg" onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>
                  {t('startJourney')} →
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>
                  {tNav('signIn')}
                </button>
              </div>
              <p className="hero-note">No credit card required · 2 people per pocket · Free forever</p>
              <div className="hero-stats">
                <div><div className="hs-n">2×</div><div className="hs-l">{t('quickStats.peoplePerPocket')}</div></div>
                <div><div className="hs-n">∞</div><div className="hs-l">{t('quickStats.transactions')}</div></div>
                <div><div className="hs-n">24/7</div><div className="hs-l">{t('quickStats.realTimeSync')}</div></div>
              </div>
            </div>

            {/* Visual card */}
            <div className="hero-visual">
              <div className="glass-card">
                <div className="gc-header">
                  <div className="gc-icon">
                    <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="gc-name">{t('pocket.familyBudget')}</div>
                    <div className="gc-sub">2 members · Active</div>
                  </div>
                  <span className="tag tag-green">Live</span>
                </div>
                <div className="gc-bal-l">{t('pocket.balance')}</div>
                <div className="gc-bal-v">2,165 MAD</div>
                <div className="gc-bar"><div className="gc-bar-fill" /></div>
                <div className="gc-tx">
                  <div className="gc-tx-row">
                    <div className="gc-tx-dot" style={{ background: 'var(--primary)' }} />
                    <span className="gc-tx-name">Monthly funding</span>
                    <span className="gc-tx-amt" style={{ color: 'var(--primary)' }}>+2,500</span>
                  </div>
                  <div className="gc-tx-row">
                    <div className="gc-tx-dot" style={{ background: 'var(--red)' }} />
                    <span className="gc-tx-name">Groceries</span>
                    <span className="gc-tx-amt" style={{ color: 'var(--red)' }}>−100</span>
                  </div>
                  <div className="gc-tx-row">
                    <div className="gc-tx-dot" style={{ background: 'var(--red)' }} />
                    <span className="gc-tx-name">Bills</span>
                    <span className="gc-tx-amt" style={{ color: 'var(--red)' }}>−1,200</span>
                  </div>
                </div>
              </div>
              <div className="float-pill a">
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />
                <span style={{ color: 'var(--primary)' }}>+2,500 MAD</span>
                <span style={{ color: 'var(--text-faint)', fontSize: '.7rem' }}>funded</span>
              </div>
              <div className="float-pill b">
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)' }} />
                <span style={{ color: 'var(--red)' }}>−1,200 MAD</span>
                <span style={{ color: 'var(--text-faint)', fontSize: '.7rem' }}>expense</span>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="features">
            <div className="features-inner">
              <span className="t-label">Why PairBudget</span>
              <h2 style={{ fontFamily: 'var(--f-head)', fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 700, letterSpacing: '-.035em', color: 'var(--text)', marginTop: '.5rem' }}>
                {t('features.title')}
              </h2>
              <div className="features-grid">
                <div className="feat">
                  <div className="feat-num">01</div>
                  <div className="feat-title">{t('features.twoPersonFocus.title')}</div>
                  <p className="feat-desc">{t('features.twoPersonFocus.description')}</p>
                </div>
                <div className="feat">
                  <div className="feat-num">02</div>
                  <div className="feat-title">{t('features.realTimeSync.title')}</div>
                  <p className="feat-desc">{t('features.realTimeSync.description')}</p>
                </div>
                <div className="feat">
                  <div className="feat-num">03</div>
                  <div className="feat-title">{t('features.securePrivate.title')}</div>
                  <p className="feat-desc">{t('features.securePrivate.description')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta-strip">
            <div className="cta-box">
              <div>
                <h2 className="cta-title">{t('cta.title')}</h2>
                <p className="cta-sub">{t('cta.description')}</p>
              </div>
              <button className="btn btn-white btn-lg" style={{ whiteSpace: 'nowrap' }} onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>
                {t('cta.createPocket')} →
              </button>
            </div>
          </section>
        </div>
      </>
    );
  }

  return null;
}
