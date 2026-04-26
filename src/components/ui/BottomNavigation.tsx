'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownRight, ArrowUpRight, History, Home, Layers, Plus, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddTransaction: (type: 'fund' | 'expense') => void;
  canAddFunds: boolean;
  canAddExpenses: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab, onTabChange, onAddTransaction, canAddFunds, canAddExpenses,
}) => {
  const tNav = useTranslations('mobileNav');
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const handleAddClick = () => {
    if (canAddFunds && canAddExpenses) setShowAddMenu(true);
    else if (canAddFunds) onAddTransaction('fund');
    else if (canAddExpenses) onAddTransaction('expense');
  };

  return (
    <>
      {showAddMenu && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="sheet-overlay"
            onClick={() => setShowAddMenu(false)}
            style={{ border: 'none', cursor: 'pointer' }}
          />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-head">
              <span className="sheet-title">Add transaction</span>
            </div>
            <div className="sheet-body">
              {canAddFunds && (
                <button
                  type="button"
                  className="sheet-row"
                  onClick={() => { onAddTransaction('fund'); setShowAddMenu(false); }}
                >
                  <div className="sheet-row-ico" style={{ background: 'var(--primary-soft)' }}>
                    <ArrowUpRight size={17} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div className="sheet-row-name">{tNav('addFunds')}</div>
                    <div className="sheet-row-sub">{tNav('addFundsDesc')}</div>
                  </div>
                </button>
              )}
              {canAddExpenses && (
                <button
                  type="button"
                  className="sheet-row"
                  onClick={() => { onAddTransaction('expense'); setShowAddMenu(false); }}
                >
                  <div className="sheet-row-ico" style={{ background: 'var(--amber-soft)' }}>
                    <ArrowDownRight size={17} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div>
                    <div className="sheet-row-name">{tNav('addExpense')}</div>
                    <div className="sheet-row-sub">{tNav('addExpenseDesc')}</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <nav className="bnav" aria-label="Bottom navigation">
        <button type="button" className={`bnav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => onTabChange('home')}>
          <Home size={18} />
          <span>{tNav('home')}</span>
        </button>
        <button type="button" className={`bnav-item ${activeTab === 'pockets' ? 'active' : ''}`} onClick={() => onTabChange('pockets')}>
          <Layers size={18} />
          <span>{tNav('pockets')}</span>
        </button>
        <button type="button" className="bnav-item fab" onClick={handleAddClick} aria-label={tNav('add')}>
          <Plus size={20} />
        </button>
        <button type="button" className={`bnav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => onTabChange('history')}>
          <History size={18} />
          <span>{tNav('history')}</span>
        </button>
        <button type="button" className={`bnav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => onTabChange('settings')}>
          <User size={18} />
          <span>{tNav('profile')}</span>
        </button>
      </nav>
    </>
  );
};

export default BottomNavigation;
