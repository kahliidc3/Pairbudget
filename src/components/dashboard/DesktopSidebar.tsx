'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownRight, ArrowUpRight, Download, FileText, LogOut, Settings, Share2,
} from 'lucide-react';

interface DesktopSidebarProps {
  canAddFunds: boolean;
  canAddExpenses: boolean;
  exportDataLoading: boolean;
  onAddFunds: () => void;
  onAddExpense: () => void;
  onInvite: () => void;
  onViewReports: () => void;
  onManagePockets: () => void;
  onLeavePocket: () => void;
  onExportData: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  canAddFunds, canAddExpenses, exportDataLoading,
  onAddFunds, onAddExpense, onInvite, onViewReports, onManagePockets, onLeavePocket, onExportData,
}) => {
  const t = useTranslations('dashboard.quickActions');

  return (
    <aside className="dsidebar">
      <div className="ds-section">{t('title')}</div>

      {canAddFunds && (
        <button type="button" className="qa g" onClick={onAddFunds}>
          <div className="qa-ico"><ArrowUpRight /></div>
          <div>
            <div className="qa-n">{t('addFunds')}</div>
            <div className="qa-d">{t('addFundsDesc')}</div>
          </div>
        </button>
      )}

      {canAddExpenses && (
        <button type="button" className="qa o" onClick={onAddExpense}>
          <div className="qa-ico"><ArrowDownRight /></div>
          <div>
            <div className="qa-n">{t('addExpense')}</div>
            <div className="qa-d">{t('addExpenseDesc')}</div>
          </div>
        </button>
      )}

      <button type="button" className="qa b" onClick={onInvite}>
        <div className="qa-ico"><Share2 /></div>
        <div>
          <div className="qa-n">{t('invitePartner')}</div>
          <div className="qa-d">{t('invitePartnerDesc')}</div>
        </div>
      </button>

      <button type="button" className="qa m" onClick={onViewReports}>
        <div className="qa-ico"><FileText /></div>
        <div>
          <div className="qa-n">{t('viewReports')}</div>
          <div className="qa-d">{t('viewReportsDesc')}</div>
        </div>
      </button>

      <div className="ds-section" style={{ marginTop: '1.25rem' }}>Settings</div>

      <button type="button" className="qa s" onClick={onManagePockets}>
        <div className="qa-ico"><Settings /></div>
        <div>
          <div className="qa-n">{t('managePockets')}</div>
          <div className="qa-d">{t('managePocketsDesc')}</div>
        </div>
      </button>

      <button type="button" className="qa r" onClick={onLeavePocket}>
        <div className="qa-ico"><LogOut /></div>
        <div>
          <div className="qa-n">{t('leavePocket')}</div>
          <div className="qa-d">{t('leavePocketDesc')}</div>
        </div>
      </button>

      <button type="button" className="qa b" onClick={onExportData} disabled={exportDataLoading}>
        <div className="qa-ico"><Download /></div>
        <div>
          <div className="qa-n">{t('exportData')}</div>
          <div className="qa-d">{t('exportDataDesc')}</div>
        </div>
      </button>
    </aside>
  );
};

export default DesktopSidebar;
