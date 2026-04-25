'use client';

import React, { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Create New Pocket</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {!onCancel && (
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Create Your Pocket</h3>
          <p className="text-white/90">Set up a new shared expense pocket</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-3">Pocket Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(validate(e.target.value)); }}
            placeholder="e.g., Family Budget, Trip Fund"
            maxLength={NAME_MAX}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors backdrop-blur-sm"
          />
          {nameError && <p className="mt-2 text-sm text-red-300">{nameError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-4">Your Role</label>
          <RoleSelector value={role} onChange={setRole} accentColor="emerald" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? <LoadingSpinner size="sm" /> : <><Plus className="w-5 h-5" /><span>Create Pocket</span></>}
        </button>
      </form>
    </div>
  );
};

export default CreatePocketForm;
