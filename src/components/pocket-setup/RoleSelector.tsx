'use client';

import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { UserRole } from '@/types';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  accentColor?: 'emerald' | 'purple';
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange, accentColor = 'emerald' }) => {
  const active = accentColor === 'emerald'
    ? 'border-emerald-500 bg-emerald-500/20'
    : 'border-purple-500 bg-purple-500/20';
  const activeBg = accentColor === 'emerald' ? 'bg-emerald-600' : 'bg-purple-600';

  return (
    <div className="space-y-3">
      {(['provider', 'spender'] as UserRole[]).map((role) => (
        <label key={role} className="cursor-pointer">
          <input
            type="radio"
            value={role}
            checked={value === role}
            onChange={() => onChange(role)}
            className="sr-only"
          />
          <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            value === role ? active : 'border-white/20 hover:border-white/30 bg-white/5'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${value === role ? activeBg : 'bg-white/20'}`}>
                {role === 'provider' ? <CreditCard className="w-5 h-5 text-white" /> : <Wallet className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="font-medium text-white capitalize">{role}</div>
                <div className="text-sm text-white/90">
                  {role === 'provider' ? 'Fund the pocket and manage budget' : 'Make purchases and log expenses'}
                </div>
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

export default RoleSelector;
