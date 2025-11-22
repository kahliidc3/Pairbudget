'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiGlobe } from 'react-icons/fi';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { signIn, signUp } from '@/services/authService';
import { clearAuthCache } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';
import { logger } from '@/lib/logger';

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const locale = useLocale();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    preferredLanguage: locale
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { setUser, setUserProfile } = useAuthStore();

  // Translation hooks
  const t = useTranslations('auth');

  // Sync form data with current locale
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      preferredLanguage: locale
    }));
  }, [locale]);

  // Clear error and success when switching modes or changing form data
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  const getErrorMessage = (error: unknown): string => {
    if (typeof error !== 'object' || error === null) {
      return 'An unexpected error occurred. Please try again.';
    }
    
    const err = error as { code?: string; message?: string };
    if (!err.code) return 'An unexpected error occurred. Please try again.';
    
    switch (err.code) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please sign in instead or use a different email.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password with at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a moment before trying again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed. Please contact support.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials. Please check your email and password.';
      default:
        return err.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    
    if (mode === 'signup' && !agreeToTerms) {
      setError('Please agree to the terms and conditions to continue.');
      return;
    }
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }
    if (mode === 'signup' && !PASSWORD_POLICY_REGEX.test(formData.password)) {
      setError('Password must be at least 12 characters and include uppercase, lowercase, number, and symbol.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!formData.password.trim()) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'signup' && !formData.name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const { user, userProfile } = await signUp(
          formData.email, 
          formData.password, 
          formData.name, 
          formData.preferredLanguage
        );
        setUser(user);
        setUserProfile(userProfile);
        setSuccess('Account created successfully! Welcome to PairBudget.');
      } else {
        const user = await signIn(formData.email, formData.password);
        setUser(user);
        setSuccess('Welcome back! Redirecting to your dashboard...');
      }
    } catch (error: unknown) {
      logger.error('Auth error', { error });
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error and success when user starts typing
    if (error) {
    setError('');
    }
    if (success) {
      setSuccess('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearCacheAndRetry = () => {
    clearAuthCache();
    setError('');
    setSuccess('Cache cleared. Please try signing in again.');
    // Reset form
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      preferredLanguage: locale
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>
      
        {/* Floating Accent Elements */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-5"
              style={{
                width: `${80 + i * 30}px`,
                height: `${80 + i * 30}px`,
                background: i % 2 === 0 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                left: `${10 + i * 25}%`,
                top: `${20 + i * 20}%`,
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, 20, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 12 + i * 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md relative">
          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm mobile-card"
          >
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-slate-900 mobile-title"
              >
                {mode === 'login' ? t('signIn') : t('signUp')}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm sm:text-base text-slate-600 mobile-subtitle"
              >
                {mode === 'login' 
                  ? 'Access your shared budget dashboard' 
                  : 'Join PairBudget to manage expenses together'
                }
              </motion.p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">{error}</p>
                      <div className="mt-2 space-y-2">
                        {error.includes('email address is already registered') && (
                          <button
                            type="button"
                            onClick={onToggleMode}
                            className="block text-sm text-red-600 hover:text-red-800 underline font-medium"
                          >
                            Sign in instead
                          </button>
                        )}
                        {(error.includes('Invalid login credentials') || 
                          error.includes('user-not-found') || 
                          error.includes('wrong-password') ||
                          error.includes('too-many-requests') ||
                          error.includes('unexpected error')) && (
                          <button
                            type="button"
                            onClick={handleClearCacheAndRetry}
                            className="block text-sm text-red-600 hover:text-red-800 underline font-medium"
                          >
                            Clear cache & retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{success}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name and Language Fields for Signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Name Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="relative group"
                    >
                      <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder={t('name')}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white mobile-input text-base"
                      />
                    </motion.div>

                    {/* Preferred Language Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="relative group"
                    >
                      <FiGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white appearance-none mobile-input text-base"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.0 : 0.7 }}
                className="relative group"
              >
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder={t('email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white mobile-input text-base"
                />
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.2 : 0.9 }}
                className="relative group"
              >
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('password')}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-12 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white mobile-input text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </motion.div>

              {/* Confirm Password Field for Signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                    className="relative group"
                  >
                    <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder={t('confirmPassword')}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-12 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white mobile-input text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms Agreement for Signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, delay: 1.6 }}
                    className="flex items-start space-x-3"
                  >
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded transition-colors"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                        Privacy Policy
                      </a>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.8 : 1.2 }}
                type="submit"
                disabled={isLoading || (mode === 'signup' && !agreeToTerms)}
                className="w-full py-3 sm:py-4 px-4 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mobile-btn-lg text-base min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="text-sm sm:text-base">{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base">{mode === 'login' ? t('signIn') : t('signUp')}</span>
                )}
              </motion.button>
            </form>

            {/* Toggle Mode */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: mode === 'signup' ? 2.0 : 1.4 }}
              className="text-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200"
            >
              <p className="text-sm sm:text-base text-slate-600">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors"
                >
                  {mode === 'login' ? t('signUp') : t('signIn')}
                </button>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
