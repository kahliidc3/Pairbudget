'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';
import { Pocket } from '@/types';

interface MobilePocketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pockets: Pocket[];
  currentPocketId: string | undefined;
  onSelect: (pocket: Pocket) => Promise<void>;
}

const WalletIcon = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
);

const MobilePocketSheet: React.FC<MobilePocketSheetProps> = ({
  isOpen, onClose, pockets, currentPocketId, onSelect,
}) => {
  const locale = useLocale();
  const { userProfile } = useAuthStore();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (pocket: Pocket) => {
    if (pocket.id === currentPocketId) { onClose(); return; }
    if (loadingId) return;
    setLoadingId(pocket.id);
    try {
      await onSelect(pocket);
      onClose();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        className="sheet-overlay"
        onClick={onClose}
        aria-label="Close"
        style={{ border: 'none', cursor: 'pointer' }}
      />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="sheet-title">Switch Pocket</span>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">
          {pockets.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No pockets found.</p>
          ) : (
            pockets.map(pocket => {
              const isCurrent = pocket.id === currentPocketId;
              const isLoading = loadingId === pocket.id;
              return (
                <button
                  key={pocket.id}
                  type="button"
                  onClick={() => handleSelect(pocket)}
                  disabled={!!loadingId}
                  className={`sheet-row ${isCurrent ? 'active' : ''}`}
                >
                  <div className="sheet-row-ico"><WalletIcon /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sheet-row-name">{pocket.name}</div>
                    <div className="sheet-row-sub">
                      {pocket.participants.length} member{pocket.participants.length !== 1 ? 's' : ''} · {formatCurrency(pocket.balance, { locale, currency: userProfile?.preferredCurrency })}
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="spinner-circle" style={{ width: 18, height: 18, flexShrink: 0 }} />
                  ) : isCurrent ? (
                    <Check size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default MobilePocketSheet;
