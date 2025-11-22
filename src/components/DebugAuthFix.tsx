'use client';

import React, { useState } from 'react';
import { createMissingUserProfile } from '@/services/authService';
import { logger } from '@/lib/logger';

const DebugAuthFix: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFixOrphanedUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Fix the known orphaned user
      const uid = 'Cw4eGZhoe9HStRnKYeJnbZOFe2';
      const email = 'khalid.chelhi@outlook.fr';
      const name = 'Khalid Chelhi'; // You can adjust this
      
      await createMissingUserProfile(uid, email, name, 'en');
      setMessage('Successfully created missing user profile! You can now sign in.');
    } catch (error) {
      logger.error('Failed to fix orphaned user', { error });
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-red-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="text-sm font-semibold text-red-700 mb-2">Debug: Fix Orphaned User</h3>
      <p className="text-xs text-gray-600 mb-3">
        This will create the missing Firestore profile for the orphaned user.
      </p>
      <button
        onClick={handleFixOrphanedUser}
        disabled={loading}
        className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Fixing...' : 'Fix Orphaned User'}
      </button>
      {message && (
        <p className={`text-xs mt-2 ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default DebugAuthFix; 
