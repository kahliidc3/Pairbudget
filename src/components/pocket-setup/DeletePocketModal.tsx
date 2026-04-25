'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FocusLock from 'react-focus-lock';
import { AlertTriangle, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useTranslations } from 'next-intl';
import { Pocket } from '@/types';

interface DeletePocketModalProps {
  pocket: Pocket | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
}

const DeletePocketModal: React.FC<DeletePocketModalProps> = ({ pocket, onConfirm, onClose, isDeleting }) => {
  const t = useTranslations('pocketSetup');
  const tC = useTranslations('common');
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!pocket) setConfirmText('');
  }, [pocket]);

  const handleClose = () => { setConfirmText(''); onClose(); };

  return (
    <AnimatePresence>
      {pocket && (
        <FocusLock returnFocus autoFocus>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-label={t('deletePocketConfirm')}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('deletePocketConfirm')}</h3>
                <p className="text-white/90 mb-4">{t('deletePocketWarning')}</p>
                <p className="text-sm text-white/70">{t('deleteConfirmText')}</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors backdrop-blur-sm text-center font-mono"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20 hover:border-white/30 font-medium"
                  >
                    {tC('cancel')}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={confirmText !== 'DELETE' || isDeleting}
                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isDeleting ? <LoadingSpinner size="sm" /> : <><Trash2 className="w-4 h-4" /><span>{t('deletePocket')}</span></>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
};

export default DeletePocketModal;
