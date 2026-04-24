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
import { 
  ArrowRight, 
  CreditCard, 
  RefreshCw, 
  Shield,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from 'lucide-react';

const AuthForm = nextDynamic(() => import('@/components/AuthForm'));

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { user, loading, setLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showAuth, setShowAuth] = useState(false);
  
  // Translation hooks
  const t = useTranslations('landing');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');

  // Check for auth parameter in URL
  useEffect(() => {
    const authParam = searchParams.get('auth');
    
    if (authParam === 'login' || authParam === 'signup') {
      setAuthMode(authParam);
      setShowAuth(true);
      
      // Clean up URL by removing the auth parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, loading, router, locale]);

  const toggleAuthMode = () => {
    setAuthMode(mode => mode === 'login' ? 'signup' : 'login');
  };

  const handleEmergencyReset = async () => {
    try {
      logger.info('Emergency reset initiated');
      clearAuthCache();
      await firebaseSignOut(auth);
      
      // Show login form directly instead of reloading
      setTimeout(() => {
        setAuthMode('login');
        setShowAuth(true);
        setLoading(false);
        // Also update the URL to reflect the auth state
        const url = new URL(window.location.href);
        url.searchParams.set('auth', 'login');
        window.history.replaceState({}, '', url.toString());
      }, 100);
    } catch (error) {
      logger.error('Error during emergency reset', { error });
      // Show login form even if sign out fails
      setTimeout(() => {
        setAuthMode('login');
        setShowAuth(true);
        setLoading(false);
        const url = new URL(window.location.href);
        url.searchParams.set('auth', 'login');
        window.history.replaceState({}, '', url.toString());
      }, 500);
    }
  };

  // Check if Firebase is configured first
  if (!isFirebaseConfigured()) {
    return <FirebaseStatus />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center max-w-md w-full mx-4">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-slate-600 font-medium mb-6">{tCommon('loading')}</p>
          <p className="text-slate-500 text-sm mb-4">
            Taking longer than expected? This might be due to authentication cache issues.
          </p>
          <button
            onClick={handleEmergencyReset}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Emergency Reset
          </button>
        </div>
      </div>
    );
  }

  if (!user && showAuth) {
    return (
      <AuthForm 
        mode={authMode} 
        onToggleMode={toggleAuthMode} 
      />
    );
  }

  if (!user) {
    return (
      <>
        <DebugAuthFix />
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-800">
        {/* Modern Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        {/* Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-emerald-500/20 rounded-full blur-lg" />
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-emerald-600/20 rounded-full blur-md" />
          
          {/* Accent Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-2 sm:mx-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-4 shadow-xl mobile-nav">
            <div className="flex items-center justify-between nav-content">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="font-bold text-white text-sm sm:text-lg nav-logo truncate">{tNav('pairbudget')}</span>
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-4 nav-actions">
                <LanguageSelector />
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium text-sm min-w-[40px] min-h-[40px] mobile-btn"
                >
                  <span className="hidden sm:inline">{tNav('signIn')}</span>
                  <span className="sm:hidden">In</span>
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="px-3 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg font-medium text-sm min-w-[40px] min-h-[40px] mobile-btn"
                >
                  <span className="hidden sm:inline">{tNav('getStarted')}</span>
                  <span className="sm:hidden">Start</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-16 sm:py-24 relative z-10 mobile-content">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-6 sm:space-y-8">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight mobile-title">
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {t('heroTitle')}
                  </span>
                  <br />
                  <span className="text-white">{t('heroSubtitle')}</span>
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-slate-200 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 mobile-subtitle">
                  {t('heroDescription')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuth(true);
                    }}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 group mobile-btn-lg"
                  >
                    <span>{t('startJourney')}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg sm:rounded-xl hover:bg-white/20 transition-all border border-white/20 font-semibold text-base sm:text-lg mobile-btn-lg"
                  >
                    {tNav('signIn')}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-gray-200 max-w-lg mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2">2</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{t('quickStats.peoplePerPocket')}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">∞</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{t('quickStats.transactions')}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">24/7</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{t('quickStats.realTimeSync')}</div>
                </div>
              </div>
            </div>

            {/* Right Visual - Dashboard Preview */}
            <div className="flex justify-center items-center">
              <div className="relative">
                {/* Main Dashboard Card */}
                <div className="max-w-sm w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900">{t('pocket.familyBudget')}</h3>
                    <p className="text-slate-600">{t('pocket.sharedPocket')}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-sm font-medium text-slate-700">{t('pocket.balance')}</span>
                      <span className="font-bold text-green-600 text-lg">1,247.50 MAD</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-sm font-medium text-slate-700">{t('pocket.thisMonth')}</span>
                      <span className="font-bold text-emerald-600 text-lg">892.30 MAD</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <span className="text-sm font-medium text-slate-700">{t('pocket.expenses')}</span>
                      <span className="font-bold text-orange-600 text-lg">654.80 MAD</span>
                    </div>
                  </div>
                </div>

                {/* Floating Transaction Cards */}
                <div className="absolute -bottom-4 -left-8 bg-white rounded-xl p-4 shadow-xl border border-slate-200 max-w-xs hidden md:block">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">+500.00 MAD</p>
                      <p className="text-xs text-slate-600">Monthly funding</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-8 bg-white rounded-xl p-4 shadow-xl border border-slate-200 max-w-xs hidden md:block">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">-89.50 MAD</p>
                      <p className="text-xs text-slate-600">Groceries</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-20 px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                {t('features.title')}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('features.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{t('features.twoPersonFocus.title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('features.twoPersonFocus.description')}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{t('features.realTimeSync.title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('features.realTimeSync.description')}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{t('features.securePrivate.title')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('features.securePrivate.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-lg">
              <div className="flex items-center justify-center mb-6">
                <div className="flex -space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center border-2 border-white">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                {t('cta.title')}
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('cta.description')}
              </p>
              
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl font-bold text-lg flex items-center justify-center space-x-3 mx-auto group"
              >
                <span>{t('cta.createPocket')}</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      </div>
      </>
    );
  }

  return null;
}


