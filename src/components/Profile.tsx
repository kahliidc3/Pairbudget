'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Mail, RefreshCw, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { deleteUserAccountAndData, updateUserProfile } from '@/services/authService';
import { usePocketStore } from '@/store/pocketStore';
import { logger } from '@/lib/logger';

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
  const { user, userProfile, setUserProfile, reset, loading } = useAuthStore();
  const { clearPocketData } = usePocketStore();

  const [selectedLang, setSelectedLang] = useState(
    userProfile?.preferredLanguage ?? locale
  );
  const [savingLang, setSavingLang] = useState(false);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NameFormValues>({
    defaultValues: { name: userProfile?.name ?? '' },
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}`);
    }
  }, [loading, user, locale, router]);

  if (loading || !user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = userProfile.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const onSaveName = async (data: NameFormValues) => {
    try {
      await updateUserProfile(user.uid, { name: data.name.trim() });
      setUserProfile({ ...userProfile, name: data.name.trim() });
      toast.success(t('successName'));
    } catch (error) {
      logger.error('Error updating name', { error });
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
    } catch (error) {
      logger.error('Error updating language', { error });
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
    } catch (error) {
      logger.error('Error deleting account', { error });
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account. Please try again later.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar & read-only info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">{userProfile.name}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>{userProfile.email}</span>
            </div>
          </div>
        </div>

        {/* Edit Name */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('displayName')}</h2>
          </div>

          <form onSubmit={handleSubmit(onSaveName)} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder={t('namePlaceholder')}
                {...register('name', {
                  required: t('nameMinLength'),
                  minLength: { value: 2, message: t('nameMinLength') },
                  maxLength: { value: 40, message: t('nameMaxLength') },
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                t('saveNameBtn')
              )}
            </button>
          </form>
        </div>

        {/* Edit Language */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{t('language')}</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 ${
                  selectedLang === lang.code
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onSaveLanguage}
            disabled={savingLang}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingLang ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              t('saveLanguageBtn')
            )}
          </button>
        </div>

        {/* Danger Zone — Delete Account */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setShowDeleteSection((v) => !v);
              setDeleteConfirm('');
              setDeleteError(null);
            }}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700">Delete Account</p>
                <p className="text-sm text-red-500">Permanently remove your profile and data</p>
              </div>
            </div>
            <span className="text-red-400 text-xl leading-none">{showDeleteSection ? '−' : '+'}</span>
          </button>

          {showDeleteSection && (
            <div className="px-6 pb-6 space-y-4 border-t border-red-100 pt-4">
              <p className="text-sm text-gray-600">
                This will remove your profile, transactions, and pocket memberships. <strong>This cannot be undone.</strong>
              </p>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-semibold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                  disabled={deleteLoading}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete My Account'
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
