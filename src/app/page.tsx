'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AuthForm from '@/components/AuthForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import FirebaseStatus from '@/components/FirebaseStatus';
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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
          <p className="text-gray-600">Loading...</p>
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Floating Elements */}
        <div className="bg-particles">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="geometric-blob"></div>
          <div className="geometric-blob"></div>
        </div>

        {/* Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-nav fixed top-3 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl mx-3 md:mx-0"
        >
          <div className="flex items-center justify-between px-3 md:px-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <Wallet className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800 text-sm md:text-base">PairBudget</span>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
                className="btn-ghost text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                className="btn-primary text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section - Centered Layout */}
        <div className="min-h-screen flex items-center justify-center px-4 py-16 md:py-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left space-y-6 md:space-y-8"
            >
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-orange-500 bg-clip-text text-transparent leading-tight"
                >
                  Expense Tracking
                  <br />
                  <span className="text-gray-800">Made for Two</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                >
                  Perfect for couples, families, and partners. Track shared expenses, 
                  manage budgets together, and keep your financial goals in sync.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start"
                >
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuth(true);
                    }}
                    className="btn-primary text-sm md:text-lg px-6 md:px-8 py-3 md:py-4 flex items-center justify-center space-x-2 group"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuth(true);
                    }}
                    className="btn-secondary text-sm md:text-lg px-6 md:px-8 py-3 md:py-4"
                  >
                    Sign In
                  </button>
                </motion.div>
              </div>

              {/* Quick Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="grid grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-gray-200 max-w-md mx-auto lg:mx-0"
              >
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1 md:mb-2">2</div>
                  <div className="text-xs md:text-sm text-gray-600">People per Pocket</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">∞</div>
                  <div className="text-xs md:text-sm text-gray-600">Transactions</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1 md:mb-2">24/7</div>
                  <div className="text-xs md:text-sm text-gray-600">Real-time Sync</div>
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
                  className="card-3d max-w-xs md:max-w-sm w-full"
                >
                  <div className="text-center mb-4 md:mb-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Family Budget</h3>
                    <p className="text-sm md:text-base text-gray-600">Shared Pocket</p>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center p-2 md:p-3 bg-white/50 rounded-lg">
                      <span className="text-xs md:text-sm text-gray-600">Balance</span>
                      <span className="font-semibold text-green-600 text-sm md:text-base">$1,247.50</span>
                    </div>
                    <div className="flex justify-between items-center p-2 md:p-3 bg-white/50 rounded-lg">
                      <span className="text-xs md:text-sm text-gray-600">This Month</span>
                      <span className="font-semibold text-blue-600 text-sm md:text-base">$892.30</span>
                    </div>
                    <div className="flex justify-between items-center p-2 md:p-3 bg-white/50 rounded-lg">
                      <span className="text-xs md:text-sm text-gray-600">Expenses</span>
                      <span className="font-semibold text-orange-600 text-sm md:text-base">$654.80</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Transaction Cards - Hidden on small screens */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute -bottom-4 -left-8 card-floating p-3 md:p-4 bg-white/90 max-w-xs hidden md:block"
                >
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-xs md:text-sm">+$500.00</p>
                      <p className="text-xs text-gray-600">Monthly funding</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="absolute -top-4 -right-8 card-floating p-3 md:p-4 bg-white/90 max-w-xs hidden md:block"
                >
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-xs md:text-sm">-$89.50</p>
                      <p className="text-xs text-gray-600">Groceries</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

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
                Built for Partnership
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                Every feature designed to make shared financial management effortless and transparent.
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
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Two-Person Focus</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Designed specifically for couples, partners, and close collaborators. 
                  No complex group management, just simple two-person expense tracking.
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
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Real-time Sync</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Every transaction syncs instantly. Both partners always see the 
                  latest balance and expenses without any delays or conflicts.
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
                <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Secure & Private</h3>
                <p className="text-sm md:text-base text-gray-600">
                  Your financial data is encrypted and secure. Only you and your 
                  partner have access to your shared budget information.
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
                Ready to Budget Together?
              </h2>
              
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
                Join thousands of couples who&apos;ve simplified their shared expenses with PairBudget.
              </p>
              
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
                className="btn-primary text-sm md:text-lg px-6 md:px-10 py-3 md:py-4 mx-auto flex items-center justify-center space-x-2 md:space-x-3 group"
              >
                <span>Create Your First Pocket</span>
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
