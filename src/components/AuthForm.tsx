'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { signIn, signUp } from '@/services/authService';
import LoadingSpinner from './LoadingSpinner';


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
    if (mode === 'signup' && formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      console.error('Auth error:', error);
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400">
              {/* Grey/Black Professional Background */}
        <div className="absolute inset-0">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.2]">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }} />
          </div>
        
        {/* Animated Floating Shapes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 60 + 40}px`,
                height: `${Math.random() * 60 + 40}px`,
                background: i % 3 === 0 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                  : i % 3 === 1 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: 'blur(1px)',
              }}
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`geo-${i}`}
              className="absolute opacity-5"
              style={{
                width: `${Math.random() * 40 + 20}px`,
                height: `${Math.random() * 40 + 20}px`,
                background: i % 2 === 0 
                  ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.2) 0%, transparent 50%)'
                  : 'linear-gradient(45deg, rgba(99, 102, 241, 0.2) 0%, transparent 50%)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '25%',
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
              animate={{
                x: [0, Math.random() * 80, 0],
                y: [0, Math.random() * 80, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
                 {/* Subtle Accent Glows */}
         <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
         <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-400/4 rounded-full blur-3xl" />
         <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-400/3 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          {/* Enhanced Glow Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl blur-2xl transform scale-110"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
            }}
          />
          
          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/50"
            style={{
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-3xl font-bold mb-3 text-gray-900"
              >
                {mode === 'login' ? t('signIn') : t('signUp')}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-gray-600"
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
                  className="mb-6 p-4 bg-red-100 border-2 border-red-400 rounded-xl shadow-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-900">{error}</p>
                      {error.includes('email address is already registered') && (
                        <button
                          type="button"
                          onClick={onToggleMode}
                          className="mt-2 text-sm text-red-600 hover:text-red-800 underline font-medium"
                        >
                          Sign in instead
                        </button>
                      )}
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
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder={t('name')}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                      />
                    </motion.div>
                    

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 0.9 : 0.7 }}
                className="relative group"
              >
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder={t('email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white ${
                    error && (error.includes('email') || error.includes('Email')) 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                />
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.0 : 0.8 }}
                className="relative group"
              >
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('password')}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={`w-full pl-12 pr-12 py-4 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white ${
                    error && (error.includes('password') || error.includes('Password')) 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </motion.div>

              {/* Confirm Password Field for Signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                      className="relative group"
                    >
                      <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder={t('password')}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                      />
            <button
              type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1"
                      >
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms Checkbox for Signup */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      className="flex items-start space-x-3"
                    >
                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="sr-only"
                          />
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              agreeToTerms 
                                ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/25' 
                                : 'bg-gray-50 border-gray-300'
                            }`}
                          >
                            {agreeToTerms && (
                              <motion.svg
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </motion.svg>
                            )}
                          </div>
                        </div>
                        <span className="text-sm leading-relaxed text-gray-600">
                          I agree to the{' '}
                          <span className="text-blue-500 underline hover:text-blue-600 transition-colors cursor-pointer">
                            Terms of Service
                          </span>{' '}
                          and{' '}
                          <span className="text-blue-500 underline hover:text-blue-600 transition-colors cursor-pointer">
                            Privacy Policy
                          </span>
                        </span>
                      </label>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading || (mode === 'signup' && !agreeToTerms)}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.3 : 0.9 }}
                className="w-full py-4 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <span className="text-base font-medium">
                    {mode === 'login' ? t('signIn') : 'Create Account'}
                  </span>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: mode === 'signup' ? 1.4 : 1.0 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-gray-600">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="font-semibold text-blue-500 hover:text-blue-600 transition-colors duration-200 underline"
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