'use client';

import React, { useState } from 'react';
import { AlertCircle, UserPlus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoleSelector from '@/components/pocket-setup/RoleSelector';
import { UserRole } from '@/types';

interface JoinPocketFormProps {
  onSubmit: (code: string, role: UserRole) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  prefillCode?: string;
}

const normalizeCode = (v: string) => {
  const compact = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return compact.length > 3 ? `${compact.slice(0, 3)}-${compact.slice(3)}` : compact;
};

const JoinPocketForm: React.FC<JoinPocketFormProps> = ({ onSubmit, isSubmitting, error, prefillCode = '' }) => {
  const [inviteCode, setInviteCode] = useState(prefillCode ? normalizeCode(prefillCode) : '');
  const [role, setRole] = useState<UserRole>('provider');
  const [codeError, setCodeError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inviteCode.replace(/-/g, '');
    if (!/^[A-Z0-9]{6}$/.test(raw)) {
      setCodeError('Invite code must be 6 letters or numbers.');
      return;
    }
    setCodeError('');
    await onSubmit(raw, role);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Join Existing</h3>
        <p className="text-white/90">Enter the invite code shared with you</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-3">Invite Code</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => { setInviteCode(normalizeCode(e.target.value)); setCodeError(''); }}
            placeholder="ABC-123"
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors backdrop-blur-sm text-center text-lg font-mono tracking-wider"
          />
          {codeError && <p className="mt-2 text-sm text-red-300">{codeError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-4">Your Role</label>
          <RoleSelector value={role} onChange={setRole} accentColor="purple" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? <LoadingSpinner size="sm" /> : <><UserPlus className="w-5 h-5" /><span>Join Pocket</span></>}
        </button>
      </form>
    </div>
  );
};

export default JoinPocketForm;
