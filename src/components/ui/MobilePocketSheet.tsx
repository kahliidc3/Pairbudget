'use client';

import React from 'react';
import { Check, Layers, X } from 'lucide-react';
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

const MobilePocketSheet: React.FC<MobilePocketSheetProps> = ({
  isOpen,
  onClose,
  pockets,
  currentPocketId,
  onSelect,
}) => {
  const locale = useLocale();
  const { userProfile } = useAuthStore();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleSelect = async (pocket: Pocket) => {
    if (pocket.id === currentPocketId) {
      onClose();
      return;
    }
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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-200 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Switch Pocket</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pocket list */}
        <div className="px-4 pb-8 space-y-2 max-h-80 overflow-y-auto">
          {pockets.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No pockets found.</p>
          ) : (
            pockets.map((pocket) => {
              const isCurrent = pocket.id === currentPocketId;
              const isLoading = loadingId === pocket.id;
              return (
                <button
                  key={pocket.id}
                  type="button"
                  onClick={() => handleSelect(pocket)}
                  disabled={!!loadingId}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  } disabled:opacity-60`}
                >
                  <div className="text-left">
                    <p className={`font-semibold ${isCurrent ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {pocket.name}
                    </p>
                    <p className={`text-sm ${isCurrent ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {pocket.participants.length} member{pocket.participants.length !== 1 ? 's' : ''} · {formatCurrency(pocket.balance, { locale, currency: userProfile?.preferredCurrency })}
                    </p>
                  </div>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : isCurrent ? (
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
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
