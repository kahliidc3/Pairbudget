'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiHeart, FiGlobe } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { signIn, signUp } from '@/services/authService';
import LoadingSpinner from './LoadingSpinner';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    preferredLanguage: 'en'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setUser, setUserProfile } = useAuthStore();
  
  // Translation hooks
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tLanguages = useTranslations('languages');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
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
      } else {
        const user = await signIn(formData.email, formData.password);
        setUser(user);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900 to-black">
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-20"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-black/30" />
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          {/* Glowing Background Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-3xl blur-xl transform scale-110"
          />
          
          {/* Main Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(88,28,135,0.3) 50%, rgba(0,0,0,0.7) 100%)'
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 rounded-full mb-6 shadow-lg shadow-purple-500/50"
              >
                <FiHeart className="w-10 h-10 text-white drop-shadow-lg" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent"
              >
                {mode === 'login' ? 'Welcome Back' : t('createAccount')}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-purple-200/80 text-lg"
              >
                {mode === 'login' 
                  ? 'Sign in to manage your shared expenses' 
                  : 'Join PairBudget to track expenses together'
                }
              </motion.p>
            </div>

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
                      <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 transition-colors group-focus-within:text-purple-300" />
                      <input
                        type="text"
                        name="name"
                        placeholder={t('name')}
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-black/30 border border-purple-500/30 rounded-2xl text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                      />
                    </motion.div>
                    
                    {/* Language Selection */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="relative group"
                    >
                      <FiGlobe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 transition-colors group-focus-within:text-purple-300" />
                      <select
                        name="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-10 py-4 bg-black/30 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 backdrop-blur-sm appearance-none"
                      >
                        <option value="en" className="bg-black text-white">{tLanguages('en')}</option>
                        <option value="fr" className="bg-black text-white">{tLanguages('fr')}</option>
                        <option value="ar" className="bg-black text-white">{tLanguages('ar')}</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                transition={{ duration: 0.5, delay: mode === 'signup' ? 0.9 : 0.7 }}
                className="relative group"
              >
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 transition-colors group-focus-within:text-purple-300" />
                <input
                  type="email"
                  name="email"
                  placeholder={t('email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-black/30 border border-purple-500/30 rounded-2xl text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                />
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: mode === 'signup' ? 1.0 : 0.8 }}
                className="relative group"
              >
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 transition-colors group-focus-within:text-purple-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('password')}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-black/30 border border-purple-500/30 rounded-2xl text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors duration-200 p-1"
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
                      <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 transition-colors group-focus-within:text-purple-300" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-12 py-4 bg-black/30 border border-purple-500/30 rounded-2xl text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors duration-200 p-1"
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
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            agreeToTerms 
                              ? 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/30' 
                              : 'border-purple-400/50 bg-black/30 group-hover:border-purple-400'
                          }`}>
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
                        <span className="text-purple-200/80 text-sm leading-relaxed">
                          I agree to the{' '}
                          <span className="text-purple-300 underline hover:text-purple-200 transition-colors cursor-pointer">
                            Terms of Service
                          </span>{' '}
                          and{' '}
                          <span className="text-purple-300 underline hover:text-purple-200 transition-colors cursor-pointer">
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
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <span className="text-lg">
                    {mode === 'login' ? t('signIn') : t('createAccount')}
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
              <p className="text-purple-200/70 text-sm">
                {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-purple-300 font-semibold hover:text-purple-200 transition-colors duration-200 underline decoration-purple-400/50 hover:decoration-purple-300"
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