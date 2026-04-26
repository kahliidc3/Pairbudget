'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { signIn, signUp } from '@/services/authService';
import { clearAuthCache } from '@/lib/utils';
import { ChevronLeft, Eye, EyeOff, Globe, Lock, Mail, User } from 'lucide-react';
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
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    preferredLanguage: locale,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [success, setSuccess] = useState('');

  const { setUser, setUserProfile } = useAuthStore();
  const t = useTranslations('auth');

  useEffect(() => {
    setFormData(prev => ({ ...prev, preferredLanguage: locale }));
  }, [locale]);

  useEffect(() => { setError(''); setSuccess(''); }, [mode]);

  const getErrorMessage = (e: unknown): { code: string; message: string } => {
    if (typeof e !== 'object' || e === null) return { code: 'unknown', message: t('errors.unexpected') };
    const err = e as { code?: string; message?: string };
    if (!err.code) return { code: 'unknown', message: t('errors.unexpected') };
    switch (err.code) {
      case 'auth/email-already-in-use': return { code: err.code, message: t('errors.emailInUse') };
      case 'auth/weak-password': return { code: err.code, message: t('errors.weakPassword') };
      case 'auth/invalid-email': return { code: err.code, message: t('errors.invalidEmail') };
      case 'auth/user-not-found': return { code: err.code, message: t('errors.userNotFound') };
      case 'auth/wrong-password': return { code: err.code, message: t('errors.wrongPassword') };
      case 'auth/too-many-requests': return { code: err.code, message: t('errors.tooManyRequests') };
      case 'auth/user-disabled': return { code: err.code, message: t('errors.userDisabled') };
      case 'auth/operation-not-allowed': return { code: err.code, message: t('errors.operationNotAllowed') };
      case 'auth/invalid-credential': return { code: err.code, message: t('errors.invalidCredential') };
      default: return { code: err.code, message: err.message || t('errors.unexpected') };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setErrorCode('');

    if (mode === 'signup' && !agreeToTerms) { setError(t('errors.acceptTerms')); return; }
    if (mode === 'signup' && formData.password !== formData.confirmPassword) { setError(t('errors.passwordMismatch')); return; }
    if (mode === 'signup' && !PASSWORD_POLICY_REGEX.test(formData.password)) { setError(t('errors.passwordPolicy')); return; }
    if (!formData.email.trim()) { setError(t('errors.emailRequired')); return; }
    if (!formData.password.trim()) { setError(t('errors.passwordRequired')); return; }
    if (mode === 'signup' && !formData.name.trim()) { setError(t('errors.nameRequired')); return; }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const { user, userProfile } = await signUp(formData.email, formData.password, formData.name, formData.preferredLanguage);
        setUser(user);
        setUserProfile(userProfile);
        setSuccess(t('success.accountCreated'));
      } else {
        const user = await signIn(formData.email, formData.password);
        setUser(user);
        setSuccess(t('success.welcomeBack'));
      }
    } catch (err: unknown) {
      logger.error('Auth error', { error: err });
      const parsed = getErrorMessage(err);
      setErrorCode(parsed.code);
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (error) setError('');
    if (success) setSuccess('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClearCacheAndRetry = () => {
    clearAuthCache();
    setError(''); setErrorCode('');
    setSuccess(t('success.cacheCleared'));
    setFormData({ email: '', password: '', confirmPassword: '', name: '', preferredLanguage: locale });
  };

  return (
    <div className="signin-split">
      {/* Left brand panel */}
      <div className="signin-left">
        <button className="sl-back" onClick={() => router.push(`/${locale}`)}>
          <ChevronLeft />
          Back to home
        </button>
        <div className="sl-content">
          <div className="sl-logo">
            <div className="sl-mark">
              <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            </div>
            <span className="sl-brand">PairBudget</span>
          </div>
          <h1 className="sl-headline">Your money.<br /><em>Together.</em></h1>
          <p className="sl-tagline">Track shared expenses, manage budgets, and stay financially aligned — effortlessly.</p>
          <div className="sl-metrics">
            <div><div className="sm-v">2</div><div className="sm-l">Per pocket</div></div>
            <div><div className="sm-v">∞</div><div className="sm-l">Transactions</div></div>
            <div><div className="sm-v">Free</div><div className="sm-l">Forever</div></div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="signin-right">
        <div className="auth-box">
          <h2 className="auth-title">
            {mode === 'login' ? t('signIn') : t('signUp')}
          </h2>
          <p className="auth-sub">
            {mode === 'login' ? t('description.login') : t('description.signup')}
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>{error}</p>
                {errorCode === 'auth/email-already-in-use' && (
                  <button type="button" onClick={onToggleMode} style={{ marginTop: '.4rem', background: 'none', border: 'none', color: 'var(--red)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>
                    {t('signInInstead')}
                  </button>
                )}
                {['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/too-many-requests', 'unknown'].includes(errorCode) && (
                  <button type="button" onClick={handleClearCacheAndRetry} style={{ marginTop: '.4rem', background: 'none', border: 'none', color: 'var(--red)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>
                    {t('clearCacheRetry')}
                  </button>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="field">
                  <label className="field-label">{t('name')}</label>
                  <div className="input-wrap">
                    <User />
                    <input
                      type="text" name="name" placeholder={t('name')} required
                      value={formData.name} onChange={handleInputChange}
                      className="input-base with-icon"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">{t('languages.en')} / {t('languages.fr')} / {t('languages.ar')}</label>
                  <div className="input-wrap">
                    <Globe />
                    <select
                      name="preferredLanguage" value={formData.preferredLanguage} onChange={handleInputChange}
                      className="input-base with-icon"
                    >
                      <option value="en">{t('languages.en')}</option>
                      <option value="fr">{t('languages.fr')}</option>
                      <option value="ar">{t('languages.ar')}</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="field">
              <label className="field-label">{t('email')}</label>
              <div className="input-wrap">
                <Mail />
                <input
                  type="email" name="email" placeholder="you@example.com" required
                  value={formData.email} onChange={handleInputChange}
                  className="input-base with-icon"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('password')}</label>
              <div className="input-wrap">
                <Lock />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" placeholder="••••••••" required
                  value={formData.password} onChange={handleInputChange}
                  className="input-base with-icon"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', display: 'flex' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="field">
                <label className="field-label">{t('confirmPassword')}</label>
                <div className="input-wrap">
                  <Lock />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="••••••••" required
                    value={formData.confirmPassword} onChange={handleInputChange}
                    className="input-base with-icon"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem', marginBottom: '1.1rem', fontSize: '.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <input
                  type="checkbox" id="terms" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)}
                  style={{ marginTop: '.2rem', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="terms">
                  {t('agreeToTermsPrefix')}{' '}
                  <a href={`/${locale}/terms`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('termsOfService')}</a>{' '}
                  {t('and')}{' '}
                  <a href={`/${locale}/privacy`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('privacyPolicy')}</a>
                </label>
              </div>
            )}

            <button
              type="submit" disabled={isLoading || (mode === 'signup' && !agreeToTerms)}
              className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '.25rem' }}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <>{mode === 'login' ? t('signIn') : t('signUp')} →</>}
            </button>
          </form>

          <div className="auth-footer">
            {mode === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
            <button type="button" onClick={onToggleMode}>
              {mode === 'login' ? t('signUp') : t('signIn')}
            </button>
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
