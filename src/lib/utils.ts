import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'MAD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'MAD' ? 'USD' : currency, // MAD not supported by Intl
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('$', currency === 'MAD' ? 'MAD ' : '$');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function generateInviteLink(inviteCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/join?code=${inviteCode}`;
}

export function clearAuthCache() {
  try {
    console.log('Starting aggressive auth cache clearing...');
    
    // Clear localStorage items that might contain cached auth data
    const keysToRemove = [
      'firebase:authUser',
      'firebase:host',
      'firebaseui::rememberedAccounts',
      'firebase:previous_websocket_failure',
      'firebase:persistence',
      'firebase:persistenceKey'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear any items that start with 'firebase:'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('firebase:') || key.includes('firebase')) {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      }
    });
    
    // Clear sessionStorage as well
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('firebase:') || key.includes('firebase')) {
        sessionStorage.removeItem(key);
        console.log(`Removed sessionStorage key: ${key}`);
      }
    });
    
    // Clear any IndexedDB data related to Firebase
    if ('indexedDB' in window) {
      try {
        // Firebase uses IndexedDB for persistence
        indexedDB.deleteDatabase('firebaseLocalStorageDb');
        console.log('Deleted Firebase IndexedDB');
      } catch (error) {
        console.warn('Could not delete Firebase IndexedDB:', error);
      }
    }
    
    // Clear cookies related to Firebase if possible
    if (document.cookie) {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('firebase') || name.includes('Firebase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log(`Cleared cookie: ${name}`);
        }
      });
    }
    
    console.log('Aggressive auth cache clearing completed');
  } catch (error) {
    console.error('Error during aggressive auth cache clearing:', error);
  }
} 