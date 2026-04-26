'use client';

import React, { useEffect, useState } from 'react';
import FocusLock from 'react-focus-lock';
import { AlertTriangle, Trash2, X } from 'lucide-react';
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

  useEffect(() => { if (!pocket) setConfirmText(''); }, [pocket]);

  if (!pocket) return null;

  const handleClose = () => { setConfirmText(''); onClose(); };

  return (
    <div className="modal-overlay">
      <FocusLock returnFocus autoFocus>
        <dialog open className="modal-dialog" aria-modal="true" aria-label={t('deletePocketConfirm')}>
          <div className="modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--red-soft)', border: '1px solid var(--red-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
              </div>
              <span className="modal-title">{t('deletePocketConfirm')}</span>
            </div>
            <button type="button" onClick={handleClose} className="modal-close" aria-label={tC('cancel')}>
              <X size={16} />
            </button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: '.875rem', color: 'var(--text-mid)', marginBottom: '.5rem' }}>{t('deletePocketWarning')}</p>
            <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('deleteConfirmText')}</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input-base"
              style={{ textAlign: 'center', fontFamily: 'var(--f-head)', letterSpacing: '.1em' }}
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-ghost">{tC('cancel')}</button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmText !== 'DELETE' || isDeleting}
              className="btn btn-red-solid"
            >
              {isDeleting ? <LoadingSpinner size="sm" /> : (
                <>
                  <Trash2 size={14} />
                  <span>{t('deletePocket')}</span>
                </>
              )}
            </button>
          </div>
        </dialog>
      </FocusLock>
    </div>
  );
};

export default DeletePocketModal;
