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
  CreditCard,
  CheckCircle,
  Activity,
  Globe
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center max-w-md w-full mx-4">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-slate-600 font-medium">{tCommon('loading')}</p>
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
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

        {/* Refined Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary Floating Elements */}
          <motion.div 
            className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-xl"
            animate={{ 
              y: [0, -20, 0], 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-lg"
            animate={{ 
              y: [0, 15, 0], 
              x: [0, 10, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-md"
            animate={{ 
              y: [0, -25, 0], 
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Accent Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Professional Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl mx-4"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-white text-lg">{tNav('pairbudget')}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <LanguageSelector />
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuth(true);
                  }}
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10 font-medium"
                >
                  {tNav('signIn')}
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuth(true);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium"
                >
                  {tNav('getStarted')}
                </button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4 py-24 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left space-y-8"
            >
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {t('heroTitle')}
                  </span>
                  <br />
                  <span className="text-white">{t('heroSubtitle')}</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-xl text-slate-200 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                >
                  {t('heroDescription')}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuth(true);
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl font-semibold text-lg flex items-center justify-center space-x-2 group"
                  >
                    <span>{t('startJourney')}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 font-semibold text-lg"
                  >
                    {tNav('signIn')}
                  </button>
                </motion.div>
              </div>

              {/* Professional Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20 max-w-lg mx-auto lg:mx-0"
              >
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-blue-400 mb-2">2</div>
                  <div className="text-sm text-slate-300 font-medium">{t('quickStats.peoplePerPocket')}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">∞</div>
                  <div className="text-sm text-slate-300 font-medium">{t('quickStats.transactions')}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                  <div className="text-sm text-slate-300 font-medium">{t('quickStats.realTimeSync')}</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Visual - Modern Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center items-center"
            >
              <div className="relative">
                {/* Main Dashboard Card */}
                <motion.div 
                  initial={{ scale: 0.9, rotateY: -15 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                  className="max-w-sm w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-900">{t('pocket.familyBudget')}</h3>
                    <p className="text-slate-600">{t('pocket.sharedPocket')}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-sm font-medium text-slate-700">{t('pocket.balance')}</span>
                      <span className="font-bold text-green-600 text-lg">$1,247.50</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-sm font-medium text-slate-700">{t('pocket.thisMonth')}</span>
                      <span className="font-bold text-blue-600 text-lg">$892.30</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <span className="text-sm font-medium text-slate-700">{t('pocket.expenses')}</span>
                      <span className="font-bold text-orange-600 text-lg">$654.80</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Transaction Cards */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute -bottom-4 -left-8 bg-white rounded-xl p-4 shadow-xl border border-slate-200 max-w-xs hidden md:block"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">+$500.00</p>
                      <p className="text-xs text-slate-600">Monthly funding</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="absolute -top-4 -right-8 bg-white rounded-xl p-4 shadow-xl border border-slate-200 max-w-xs hidden md:block"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">-$89.50</p>
                      <p className="text-xs text-slate-600">Groceries</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Modern Features Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="py-20 px-4 relative"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                {t('features.title')}
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                {t('features.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 0.6 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{t('features.twoPersonFocus.title')}</h3>
                <p className="text-slate-300 leading-relaxed">
                  {t('features.twoPersonFocus.description')}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.6 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{t('features.realTimeSync.title')}</h3>
                <p className="text-slate-300 leading-relaxed">
                  {t('features.realTimeSync.description')}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1, duration: 0.6 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">{t('features.securePrivate.title')}</h3>
                <p className="text-slate-300 leading-relaxed">
                  {t('features.securePrivate.description')}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Enhanced CTA Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.8 }}
          className="py-20 px-4 relative"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12">
              <div className="flex items-center justify-center mb-6">
                <div className="flex -space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center border-2 border-white">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                {t('cta.title')}
              </h2>
              
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {t('cta.description')}
              </p>
              
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl font-bold text-lg flex items-center justify-center space-x-3 mx-auto group"
              >
                <span>{t('cta.createPocket')}</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    );
  }

  return null;
}

