'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileText,
  LogOut,
  Settings,
  Share2,
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
  canAddFunds,
  canAddExpenses,
  exportDataLoading,
  onAddFunds,
  onAddExpense,
  onInvite,
  onViewReports,
  onManagePockets,
  onLeavePocket,
  onExportData,
}) => {
  const tDashboard = useTranslations('dashboard');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{tDashboard('quickActions.title')}</h3>
      <div className="space-y-3">
        {canAddFunds && (
          <button
            onClick={onAddFunds}
            className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">{tDashboard('quickActions.addFunds')}</p>
              <p className="text-sm text-gray-600">{tDashboard('quickActions.addFundsDesc')}</p>
            </div>
          </button>
        )}
        {canAddExpenses && (
          <button
            onClick={onAddExpense}
            className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">{tDashboard('quickActions.addExpense')}</p>
              <p className="text-sm text-gray-600">{tDashboard('quickActions.addExpenseDesc')}</p>
            </div>
          </button>
        )}
        <button
          onClick={onInvite}
          className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center">
            <Share2 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{tDashboard('quickActions.invitePartner')}</p>
            <p className="text-sm text-gray-600">{tDashboard('quickActions.invitePartnerDesc')}</p>
          </div>
        </button>
        <button
          onClick={onViewReports}
          className="w-full flex items-center space-x-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-emerald-100 group-hover:bg-emerald-200 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{tDashboard('quickActions.viewReports')}</p>
            <p className="text-sm text-gray-600">{tDashboard('quickActions.viewReportsDesc')}</p>
          </div>
        </button>
        <button
          onClick={onManagePockets}
          className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{tDashboard('quickActions.managePockets')}</p>
            <p className="text-sm text-gray-600">{tDashboard('quickActions.managePocketsDesc')}</p>
          </div>
        </button>
        <button
          onClick={onLeavePocket}
          className="w-full flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 group"
        >
          <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{tDashboard('quickActions.leavePocket')}</p>
            <p className="text-sm text-gray-600">{tDashboard('quickActions.leavePocketDesc')}</p>
          </div>
        </button>
        <button
          onClick={onExportData}
          disabled={exportDataLoading}
          className="w-full flex items-center space-x-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{tDashboard('quickActions.exportData')}</p>
            <p className="text-sm text-gray-600">{tDashboard('quickActions.exportDataDesc')}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DesktopSidebar;
