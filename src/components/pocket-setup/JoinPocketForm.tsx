'use client';

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
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
      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="invite-code" className="field-label">Invite Code</label>
          <div className="input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={(e) => { setInviteCode(normalizeCode(e.target.value)); setCodeError(''); }}
              placeholder="PB-XXXXXX"
              required
              className="input-base with-icon"
              style={{ textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'center', fontFamily: 'var(--f-head)' }}
            />
          </div>
          {codeError && <p style={{ marginTop: '.4rem', fontSize: '.75rem', color: 'var(--red)' }}>{codeError}</p>}
        </div>

        <span className="field-label" style={{ display: 'block', marginBottom: '.65rem' }}>Your Role</span>
        <RoleSelector value={role} onChange={setRole} />

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : (
            <>
              <UserPlus size={15} />
              <span>Join Pocket</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default JoinPocketForm;
