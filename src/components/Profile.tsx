'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Mail, Trash2, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { deleteUserAccountAndData, updateUserProfile } from '@/services/authService';
import { usePocketStore } from '@/store/pocketStore';
import { logger } from '@/lib/logger';
import LoadingSpinner from '@/components/LoadingSpinner';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
] as const;

type NameFormValues = { name: string };

const Profile: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const tC = useTranslations('common');
  const { user, userProfile, setUserProfile, reset, loading } = useAuthStore();
  const { clearPocketData } = usePocketStore();

  const [selectedLang, setSelectedLang] = useState(userProfile?.preferredLanguage ?? locale);
  const [savingLang, setSavingLang] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NameFormValues>({
    defaultValues: { name: userProfile?.name ?? '' },
  });

  useEffect(() => {
    if (!loading && !user) router.replace(`/${locale}`);
  }, [loading, user, locale, router]);

  if (loading || !user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const initials = userProfile.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);

  const onSaveName = async (data: NameFormValues) => {
    try {
      await updateUserProfile(user.uid, { name: data.name.trim() });
      setUserProfile({ ...userProfile, name: data.name.trim() });
      toast.success(t('successName'));
    } catch (err) {
      logger.error('Error updating name', { error: err });
      toast.error(t('errorName'));
    }
  };

  const onSaveLanguage = async () => {
    setSavingLang(true);
    try {
      await updateUserProfile(user.uid, { preferredLanguage: selectedLang });
      setUserProfile({ ...userProfile, preferredLanguage: selectedLang });
      toast.success(t('successLanguage'));
      router.replace(`/${selectedLang}/profile`);
    } catch (err) {
      logger.error('Error updating language', { error: err });
      toast.error(t('errorLanguage'));
    } finally {
      setSavingLang(false);
    }
  };

  const onDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteUserAccountAndData();
      clearPocketData();
      reset();
      router.replace(`/${locale}`);
    } catch (err) {
      logger.error('Error deleting account', { error: err });
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <nav className="nav">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="btn btn-icon btn-ghost"
          aria-label={t('back')}
        >
          <ArrowLeft size={15} />
        </button>
        <span className="nav-name">{t('title')}</span>
        <div className="nav-spacer" />
      </nav>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Avatar card */}
        <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '.85rem' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg, var(--v-700), var(--v-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
            <span style={{ fontFamily: 'var(--f-head)', fontSize: '1.6rem', fontWeight: 700, color: '#fff', letterSpacing: '-.04em' }}>{initials}</span>
          </div>
          <div>
            <p className="t-head" style={{ fontSize: '1.2rem' }}>{userProfile.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', marginTop: '.2rem', color: 'var(--text-muted)', fontSize: '.875rem' }}>
              <Mail size={14} />
              <span>{userProfile.email}</span>
            </div>
          </div>
        </div>

        {/* Edit name */}
        <div className="card card-padded">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <User size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="t-head" style={{ fontSize: '1rem' }}>{t('displayName')}</h2>
          </div>

          <form onSubmit={handleSubmit(onSaveName)}>
            <div className="field">
              <input
                id="profile-name"
                type="text"
                placeholder={t('namePlaceholder')}
                {...register('name', {
                  required: t('nameMinLength'),
                  minLength: { value: 2, message: t('nameMinLength') },
                  maxLength: { value: 40, message: t('nameMaxLength') },
                })}
                className="input-base"
              />
              {errors.name && (
                <p style={{ marginTop: '.4rem', fontSize: '.75rem', color: 'var(--red)' }}>{errors.name.message}</p>
              )}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
              {isSubmitting ? <LoadingSpinner size="sm" /> : t('saveNameBtn')}
            </button>
          </form>
        </div>

        {/* Language */}
        <div className="card card-padded">
          <h2 className="t-head" style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('language')}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.6rem', marginBottom: '1rem' }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`role-opt ${selectedLang === lang.code ? 'sel' : ''}`}
                style={{ justifyContent: 'center', padding: '.7rem' }}
              >
                <span className="ro-name" style={{ fontSize: '.85rem' }}>{lang.label}</span>
              </button>
            ))}
          </div>

          <button type="button" onClick={onSaveLanguage} disabled={savingLang} className="btn btn-primary" style={{ width: '100%' }}>
            {savingLang ? <LoadingSpinner size="sm" /> : t('saveLanguageBtn')}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ borderColor: 'var(--red-border)', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => { setShowDeleteSection(v => !v); setDeleteConfirm(''); setDeleteError(null); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.4rem', background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
              <div>
                <p style={{ fontFamily: 'var(--f-body)', fontWeight: 700, color: 'var(--red)' }}>Delete Account</p>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Permanently remove your profile and data</p>
              </div>
            </div>
            <span style={{ color: 'var(--red)', fontSize: '1.2rem' }}>{showDeleteSection ? '−' : '+'}</span>
          </button>

          {showDeleteSection && (
            <div style={{ padding: '0 1.4rem 1.4rem', borderTop: '1px solid var(--red-border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.85rem' }}>
                This will remove your profile, transactions, and pocket memberships. <strong>This cannot be undone.</strong>
              </p>

              {deleteError && <div className="alert alert-error" style={{ marginBottom: '.85rem' }}>{deleteError}</div>}

              <div className="field">
                <label htmlFor="delete-confirm" className="field-label">Type DELETE to confirm</label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                  disabled={deleteLoading}
                  placeholder="DELETE"
                  className="input-base"
                  style={{ textAlign: 'center', fontFamily: 'var(--f-head)', letterSpacing: '.1em' }}
                />
              </div>

              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                className="btn btn-red-solid"
                style={{ width: '100%' }}
              >
                {deleteLoading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Trash2 size={14} />
                    <span>{tC('delete')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
