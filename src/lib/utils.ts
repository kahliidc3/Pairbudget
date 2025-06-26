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
    // Clear localStorage items that might contain cached auth data
    const keysToRemove = [
      'firebase:authUser',
      'firebase:host',
      'firebaseui::rememberedAccounts',
      'firebase:previous_websocket_failure'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any items that start with 'firebase:'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('firebase:')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage as well
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('firebase:')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Auth cache cleared');
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
} 