'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiGlobe, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { signIn, signUp } from '@/services/authService';
import { clearAuthCache } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';
import WaitingOverlay from './ui/WaitingOverlay';
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
  const [errorCode, setErrorCode] = useState('');
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

  const getErrorMessage = (error: unknown): { code: string; message: string } => {
    if (typeof error !== 'object' || error === null) {
      return { code: 'unknown', message: t('errors.unexpected') };
    }
    
    const err = error as { code?: string; message?: string };
    if (!err.code) return { code: 'unknown', message: t('errors.unexpected') };
    
    switch (err.code) {
      case 'auth/email-already-in-use':
        return { code: err.code, message: t('errors.emailInUse') };
      case 'auth/weak-password':
        return { code: err.code, message: t('errors.weakPassword') };
      case 'auth/invalid-email':
        return { code: err.code, message: t('errors.invalidEmail') };
      case 'auth/user-not-found':
        return { code: err.code, message: t('errors.userNotFound') };
      case 'auth/wrong-password':
        return { code: err.code, message: t('errors.wrongPassword') };
      case 'auth/too-many-requests':
        return { code: err.code, message: t('errors.tooManyRequests') };
      case 'auth/user-disabled':
        return { code: err.code, message: t('errors.userDisabled') };
      case 'auth/operation-not-allowed':
        return { code: err.code, message: t('errors.operationNotAllowed') };
      case 'auth/invalid-credential':
        return { code: err.code, message: t('errors.invalidCredential') };
      default:
        return { code: err.code, message: err.message || t('errors.unexpected') };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    setErrorCode('');
    
    if (mode === 'signup' && !agreeToTerms) {
      setError(t('errors.acceptTerms'));
      return;
    }
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }
    if (mode === 'signup' && !PASSWORD_POLICY_REGEX.test(formData.password)) {
      setError(t('errors.passwordPolicy'));
      return;
    }
    if (!formData.email.trim()) {
      setError(t('errors.emailRequired'));
      return;
    }
    if (!formData.password.trim()) {
      setError(t('errors.passwordRequired'));
      return;
    }
    if (mode === 'signup' && !formData.name.trim()) {
      setError(t('errors.nameRequired'));
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
        setSuccess(t('success.accountCreated'));
      } else {
        const user = await signIn(formData.email, formData.password);
        setUser(user);
        setSuccess(t('success.welcomeBack'));
      }
    } catch (error: unknown) {
      logger.error('Auth error', { error });
      const parsedError = getErrorMessage(error);
      setErrorCode(parsedError.code);
      setError(parsedError.message);
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
    setErrorCode('');
    setSuccess(t('success.cacheCleared'));
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
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md relative">
          {/* Main Form Card */}
          <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm mobile-card">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-slate-900 mobile-title">
                {mode === 'login' ? t('signIn') : t('signUp')}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 mobile-subtitle">
                {mode === 'login'
                  ? t('description.login')
                  : t('description.signup')
                }
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
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
                        {errorCode === 'auth/email-already-in-use' && (
                          <button
                            type="button"
                            onClick={onToggleMode}
                            className="block text-sm text-red-600 hover:text-red-800 underline font-medium"
                          >
                            {t('signInInstead')}
                          </button>
                        )}
                        {['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/too-many-requests', 'unknown'].includes(errorCode) && (
                          <button
                            type="button"
                            onClick={handleClearCacheAndRetry}
                            className="block text-sm text-red-600 hover:text-red-800 underline font-medium"
                          >
                            {t('clearCacheRetry')}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
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
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Name Field */}
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder={t('name')}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white mobile-input text-base"
                      />
                    </div>

                    {/* Preferred Language Field */}
                    <div className="relative group">
                      <FiGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white appearance-none mobile-input text-base"
                      >
                        <option value="en">{t('languages.en')}</option>
                        <option value="fr">{t('languages.fr')}</option>
                        <option value="ar">{t('languages.ar')}</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  placeholder={t('email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white mobile-input text-base"
                />
              </div>

              {/* Password Field */}
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('password')}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-12 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white mobile-input text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirm Password Field for Signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
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
                      className="w-full pl-12 pr-12 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white mobile-input text-base"
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start space-x-3"
                  >
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded transition-colors"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                      {t('agreeToTermsPrefix')}{' '}
                      <a href={`/${locale}/terms`} className="text-emerald-600 hover:text-emerald-700 underline">
                        {t('termsOfService')}
                      </a>{' '}
                      {t('and')}{' '}
                      <a href={`/${locale}/privacy`} className="text-emerald-600 hover:text-emerald-700 underline">
                        {t('privacyPolicy')}
                      </a>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (mode === 'signup' && !agreeToTerms)}
                className="w-full py-3 sm:py-4 px-4 bg-emerald-600 text-white rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mobile-btn-lg text-base min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="text-sm sm:text-base">{mode === 'login' ? t('loading.signingIn') : t('loading.creatingAccount')}</span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base">{mode === 'login' ? t('signIn') : t('signUp')}</span>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="text-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
              <p className="text-sm sm:text-base text-slate-600">
                {mode === 'login' ? t('dontHaveAccount') + ' ' : t('alreadyHaveAccount') + ' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-emerald-600 hover:text-emerald-700 font-medium underline transition-colors"
                >
                  {mode === 'login' ? t('signUp') : t('signIn')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <WaitingOverlay
        isVisible={isLoading}
        label={mode === 'login' ? t('loading.signingIn') : t('loading.creatingAccount')}
      />
    </div>
  );
}
