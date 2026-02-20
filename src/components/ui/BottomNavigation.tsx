'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  History, 
  Home,
  Plus,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddTransaction: (type: 'fund' | 'expense') => void;
  canAddFunds: boolean;
  canAddExpenses: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onAddTransaction,
  canAddFunds,
  canAddExpenses
}) => {
  const tNav = useTranslations('mobileNav');
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const tabs = [
    { id: 'home', label: tNav('home'), icon: Home },
    { id: 'add', label: tNav('add'), icon: Plus, isAction: true },
    { id: 'history', label: tNav('history'), icon: History },
    { id: 'settings', label: tNav('settings'), icon: Settings }
  ];

  const handleAddClick = () => {
    if (canAddFunds && canAddExpenses) {
      setShowAddMenu(!showAddMenu);
    } else if (canAddFunds) {
      onAddTransaction('fund');
    } else if (canAddExpenses) {
      onAddTransaction('expense');
    }
  };

  return (
    <>
      {/* Add Menu Overlay */}
      {showAddMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowAddMenu(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-32 left-1/2 transform -translate-x-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 min-w-64">
              <div className="space-y-3">
                {canAddFunds && (
                  <button
                    onClick={() => {
                      onAddTransaction('fund');
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{tNav('addFunds')}</p>
                      <p className="text-sm text-gray-600">{tNav('addFundsDesc')}</p>
                    </div>
                  </button>
                )}
                
                {canAddExpenses && (
                  <button
                    onClick={() => {
                      onAddTransaction('expense');
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center">
                      <ArrowDownRight className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{tNav('addExpense')}</p>
                      <p className="text-sm text-gray-600">{tNav('addExpenseDesc')}</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.isAction) {
                    handleAddClick();
                  } else {
                    onTabChange(tab.id);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all duration-200",
                  tab.isAction 
                    ? "bg-blue-600 text-white scale-110 shadow-lg" 
                    : activeTab === tab.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
                aria-label={tab.label}
              >
                <tab.icon className={cn(
                  "w-6 h-6 mb-1",
                  tab.isAction && "w-7 h-7"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  tab.isAction && "hidden"
                )}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;
