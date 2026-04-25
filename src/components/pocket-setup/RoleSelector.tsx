'use client';

import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { UserRole } from '@/types';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange }) => {
  const roles: { id: UserRole; name: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'provider', name: 'Provider', desc: 'Fund the pocket and manage the budget', icon: <CreditCard /> },
    { id: 'spender',  name: 'Spender',  desc: 'Log purchases and record expenses',     icon: <Wallet /> },
  ];

  return (
    <div className="role-opts">
      {roles.map(role => (
        <button
          type="button"
          key={role.id}
          onClick={() => onChange(role.id)}
          className={`role-opt ${value === role.id ? 'sel' : ''}`}
        >
          <div className="ro-ico">{role.icon}</div>
          <div>
            <div className="ro-name">{role.name}</div>
            <div className="ro-desc">{role.desc}</div>
          </div>
          <div className="ro-radio" />
        </button>
      ))}
    </div>
  );
};

export default RoleSelector;
