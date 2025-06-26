'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslations, useLocale } from 'next-intl';
import AuthForm from '@/components/AuthForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import FirebaseStatus from '@/components/FirebaseStatus';
import LanguageSelector from '@/components/LanguageSelector';
import { isFirebaseConfigured } from '@/lib/firebase-init';
import { 
  Users, 
  Shield, 
  Zap, 
  Star,
  ArrowRight,
  Wallet,
  TrendingUp,
  CreditCard
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { user, loading } = useAuthStore();
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

  // Check if Firebase is configured first
  if (!isFirebaseConfigured()) {
    return <FirebaseStatus />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card animate-scale-in text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">{tCommon('loading')}</p>
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Circles */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full animate-pulse" style={{
            animation: 'float 20s ease-in-out infinite'
          }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full" style={{
            animation: 'float 25s ease-in-out infinite reverse'
          }}></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full" style={{
            animation: 'float 15s ease-in-out infinite'
          }}></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-full" style={{
            animation: 'float 18s ease-in-out infinite reverse'
          }}></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-500/20 rounded-full" style={{
            animation: 'float 22s ease-in-out infinite'
          }}></div>
          <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full" style={{
            animation: 'float 30s ease-in-out infinite reverse'
          }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-br from-indigo-600/20 to-purple-500/20 rounded-full" style={{
            animation: 'float 12s ease-in-out infinite'
          }}></div>
          <div className="absolute top-10 right-1/2 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full" style={{
            animation: 'float 16s ease-in-out infinite reverse'
          }}></div>

          {/* Geometric Shapes */}
          <div className="absolute top-1/4 left-20 w-16 h-16 bg-gradient-to-br from-blue-500/15 to-purple-600/15 transform rotate-45" style={{
            animation: 'float 20s ease-in-out infinite, spin 40s linear infinite'
          }}></div>
          <div className="absolute bottom-1/4 right-16 w-12 h-12 bg-gradient-to-br from-purple-500/15 to-indigo-600/15 rounded-lg transform rotate-12" style={{
            animation: 'float 25s ease-in-out infinite reverse, spin 35s linear infinite reverse'
          }}></div>
          <div className="absolute top-2/3 left-1/4 w-14 h-14 bg-gradient-to-br from-indigo-500/15 to-blue-600/15 rounded-full transform" style={{
            animation: 'float 18s ease-in-out infinite'
          }}></div>
          <div className="absolute bottom-40 right-1/4 w-18 h-18 bg-gradient-to-br from-cyan-500/15 to-purple-600/15 rounded-xl transform rotate-45" style={{
            animation: 'float 22s ease-in-out infinite reverse'
          }}></div>
          <div className="absolute top-1/2 right-20 w-10 h-10 bg-gradient-to-br from-purple-600/15 to-pink-500/15 rounded-lg transform rotate-12" style={{
            animation: 'float 15s ease-in-out infinite'
          }}></div>
          <div className="absolute bottom-1/2 left-16 w-20 h-8 bg-gradient-to-br from-blue-600/15 to-indigo-500/15 rounded-full transform rotate-45" style={{
            animation: 'float 28s ease-in-out infinite reverse'
          }}></div>

          {/* Accent Glows */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/5 to-transparent rounded-full blur-3xl"></div>
        </div>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-2 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl mx-2 md:mx-0"
        >
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-full px-4 md:px-4 py-3 md:py-3 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white text-base md:text-base">{tNav('pairbudget')}</span>
              </div>
              
              <div className="flex items-center space-x-2 md:space-x-4 rtl:space-x-reverse">
                <LanguageSelector />
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  className="text-sm px-3 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  {tNav('signIn')}
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="text-sm px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
                >
                  {tNav('getStarted')}
                </button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section - Centered Layout */}
        <div className="min-h-screen flex items-center justify-center px-4 py-20 md:py-20 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left rtl:lg:text-right space-y-8"
            >
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    {t('heroTitle')}
                  </span>
                  <br />
                  <span className="text-white">{t('heroSubtitle')}</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-lg md:text-xl lg:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 rtl:lg:mr-0"
                >
                  {t('heroDescription')}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start rtl:lg:justify-end"
                >
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuth(true);
                    }}
                    className="text-lg px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 rtl:space-x-reverse group"
                  >
                    <span>{t('startJourney')}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 rtl:group-hover:translate-x-0" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                  >
                    {tNav('signIn')}
                  </button>
                </motion.div>
              </div>

              {/* Quick Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20 max-w-md mx-auto lg:mx-0 rtl:lg:mr-0"
              >
                <div className="text-center lg:text-left rtl:lg:text-right">
                  <div className="text-3xl font-bold text-blue-400 mb-2">2</div>
                  <div className="text-sm text-gray-300">{t('quickStats.peoplePerPocket')}</div>
                </div>
                <div className="text-center lg:text-left rtl:lg:text-right">
                  <div className="text-3xl font-bold text-purple-400 mb-2">∞</div>
                  <div className="text-sm text-gray-300">{t('quickStats.transactions')}</div>
                </div>
                <div className="text-center lg:text-left rtl:lg:text-right">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
                  <div className="text-sm text-gray-300">{t('quickStats.realTimeSync')}</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center items-center order-first lg:order-last"
            >
              <div className="relative">
                {/* Main Card */}
                <motion.div 
                  initial={{ scale: 0.9, rotateY: -15 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                  className="max-w-sm md:max-w-sm w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{t('pocket.familyBudget')}</h3>
                    <p className="text-base text-gray-300">{t('pocket.sharedPocket')}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-sm text-gray-300">{t('pocket.balance')}</span>
                      <span className="font-semibold text-green-400 text-base">$1,247.50</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-sm text-gray-300">{t('pocket.thisMonth')}</span>
                      <span className="font-semibold text-blue-400 text-base">$892.30</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-sm text-gray-300">{t('pocket.expenses')}</span>
                      <span className="font-semibold text-orange-400 text-base">$654.80</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Transaction Cards - Hidden on small screens */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute -bottom-4 -left-8 rtl:-right-8 rtl:left-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-3 md:p-4 max-w-xs hidden md:block shadow-lg"
                >
                  <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-xs md:text-sm text-white">+$500.00</p>
                      <p className="text-xs text-gray-300">Monthly funding</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="absolute -top-4 -right-8 rtl:-left-8 rtl:right-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-3 md:p-4 max-w-xs hidden md:block shadow-lg"
                >
                  <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-xs md:text-sm text-white">-$89.50</p>
                      <p className="text-xs text-gray-300">Groceries</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(5deg); }
            50% { transform: translateY(-10px) rotate(0deg); }
            75% { transform: translateY(-30px) rotate(-5deg); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Features Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="py-16 md:py-20 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t('features.title')}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                {t('features.description')}
              </p>
            </div>

            <div className="card-grid-asymmetric">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 0.6 }}
                className="card-floating text-center"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{t('features.twoPersonFocus.title')}</h3>
                <p className="text-sm md:text-base text-gray-600">
                  {t('features.twoPersonFocus.description')}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.6 }}
                className="card-floating text-center"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{t('features.realTimeSync.title')}</h3>
                <p className="text-sm md:text-base text-gray-600">
                  {t('features.realTimeSync.description')}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1, duration: 0.6 }}
                className="card-floating text-center"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{t('features.securePrivate.title')}</h3>
                <p className="text-sm md:text-base text-gray-600">
                  {t('features.securePrivate.description')}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.8 }}
          className="py-16 md:py-20 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="card-floating">
              <div className="flex items-center justify-center mb-4 md:mb-6">
                <div className="flex -space-x-1 md:-space-x-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t('cta.title')}
              </h2>
              
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
                {t('cta.description')}
              </p>
              
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                className="btn-primary text-sm md:text-lg px-6 md:px-10 py-3 md:py-4 mx-auto flex items-center justify-center space-x-2 md:space-x-3 group"
              >
                <span>{t('cta.createPocket')}</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    );
  }

  return null;
}

