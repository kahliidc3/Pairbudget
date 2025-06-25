export interface User {
  uid: string;
  name: string;
  email: string;
  currentPocketId?: string;
  pocketIds: string[]; // Array of pocket IDs the user belongs to
  preferredLanguage?: string;
  createdAt: Date;
}

export interface Pocket {
  id: string;
  name: string;
  createdAt: Date;
  participants: string[]; // Array of user UIDs
  roles: {
    [uid: string]: 'provider' | 'spender';
  };
  balance: number;
  totalFunded: number;
  totalSpent: number;
  inviteCode?: string;
}

export interface Transaction {
  id: string;
  pocketId: string;
  userId: string;
  type: 'fund' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: Date;
  receiptUrl?: string;
  createdAt: Date;
}

export type UserRole = 'provider' | 'spender';

export interface InvitationData {
  pocketId: string;
  pocketName: string;
  inviterName: string;
  role: UserRole;
}

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Transport',
  'Utilities',
  'Healthcare',
  'Education',
  'Entertainment',
  'Restaurants',
  'Shopping',
  'Bills',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]; 