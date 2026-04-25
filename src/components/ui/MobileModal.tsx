'use client';

import React from 'react';
import { X } from 'lucide-react';
import FocusLock from 'react-focus-lock';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** @deprecated kept for backwards compat — modal is responsive by default */
  fullScreen?: boolean;
  showCloseButton?: boolean;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen, onClose, title, children, showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <FocusLock returnFocus autoFocus>
        <dialog
          open
          className="modal-dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-head">
            <span className="modal-title">{title}</span>
            {showCloseButton && (
              <button type="button" onClick={onClose} className="modal-close" aria-label="Close dialog">
                <X size={16} />
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 60px)' }}>
            {children}
          </div>
        </dialog>
      </FocusLock>
    </div>
  );
};

export default MobileModal;
