'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoleSelector from '@/components/pocket-setup/RoleSelector';
import { UserRole } from '@/types';

interface CreatePocketFormProps {
  onSubmit: (name: string, role: UserRole) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  onCancel?: () => void;
}

const NAME_MIN = 3;
const NAME_MAX = 50;

const CreatePocketForm: React.FC<CreatePocketFormProps> = ({ onSubmit, isSubmitting, error, onCancel }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('provider');
  const [nameError, setNameError] = useState('');

  const validate = (v: string) => {
    const t = v.trim();
    if (t.length < NAME_MIN) return `Pocket name must be at least ${NAME_MIN} characters.`;
    if (t.length > NAME_MAX) return `Pocket name must be ${NAME_MAX} characters or fewer.`;
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(name);
    if (err) { setNameError(err); return; }
    setNameError('');
    await onSubmit(name.trim(), role);
  };

  return (
    <div>
      {onCancel && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 className="t-head" style={{ fontSize: '1.1rem' }}>Create New Pocket</h3>
          <button type="button" onClick={onCancel} className="modal-close" aria-label="Close">
            <X size={16} />
          </button>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="pocket-name" className="field-label">Pocket Name</label>
          <div className="input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
            <input
              id="pocket-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(validate(e.target.value)); }}
              placeholder="e.g. Family Budget, Trip Fund…"
              maxLength={NAME_MAX}
              required
              className="input-base with-icon"
            />
          </div>
          {nameError && <p style={{ marginTop: '.4rem', fontSize: '.75rem', color: 'var(--red)' }}>{nameError}</p>}
        </div>

        <span className="field-label" style={{ display: 'block', marginBottom: '.65rem' }}>Your Role</span>
        <RoleSelector value={role} onChange={setRole} />

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          {isSubmitting ? <LoadingSpinner size="sm" /> : (
            <>
              <Plus size={15} />
              <span>Create Pocket</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatePocketForm;
