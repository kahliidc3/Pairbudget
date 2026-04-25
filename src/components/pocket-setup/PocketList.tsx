'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pocket } from '@/types';

interface PocketListProps {
  pockets: Pocket[];
  onSelect: (pocket: Pocket) => void;
  onDelete: (pocket: Pocket) => void;
  onCreate?: () => void;
  locale: string;
  preferredCurrency?: string;
  isLoading: boolean;
}

const WalletIcon = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
);

const PocketList: React.FC<PocketListProps> = ({
  pockets, onSelect, onDelete, onCreate, locale, preferredCurrency, isLoading,
}) => (
  <div className="pockets-grid">
    {pockets.map((pocket) => {
      const negative = pocket.balance < 0;
      return (
        <div key={pocket.id} className="pc">
          <div className="pc-top">
            <div className={`pc-ico ${negative ? 'red' : 'green'}`}><WalletIcon /></div>
            <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
              <span className={`tag ${negative ? 'tag-red' : 'tag-green'}`}>{negative ? 'Overdrawn' : 'Active'}</span>
              <button
                type="button"
                onClick={() => onDelete(pocket)}
                className="btn btn-icon btn-ghost"
                aria-label={`Delete ${pocket.name}`}
                style={{ border: 'none', background: 'transparent' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="pc-name">{pocket.name}</div>
          <div className="pc-bal-l">Balance</div>
          <div className={`pc-bal ${negative ? 'red' : 'green'}`}>
            {formatCurrency(pocket.balance, { locale, currency: preferredCurrency })}
          </div>
          <div className="pc-meta">
            <div className="pc-meta-item"><strong>{pocket.participants.length}</strong> members</div>
            <div className="pc-meta-item">{formatDate(pocket.createdAt, locale)}</div>
          </div>
          <hr className="pc-divider" />
          <button
            type="button"
            onClick={() => onSelect(pocket)}
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Open Dashboard →
          </button>
        </div>
      );
    })}
    {onCreate && (
      <button type="button" className="pc-add" onClick={onCreate}>
        <div className="pc-add-ico">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </div>
        <span className="pc-add-lbl">New Pocket</span>
      </button>
    )}
  </div>
);

export default PocketList;
