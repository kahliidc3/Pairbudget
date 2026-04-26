import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Wallet } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import TransactionCard from '@/components/ui/TransactionCard';
import AuthForm from '@/components/AuthForm';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    setUser: vi.fn(),
    setUserProfile: vi.fn(),
  }),
}));

vi.mock('@/services/authService', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils');
  return {
    ...actual,
    clearAuthCache: vi.fn(),
  };
});

describe('component unit tests', () => {
  it('renders StatCard content', () => {
    render(
      <StatCard
        title="Balance"
        value="$100"
        icon={Wallet}
        iconColor="blue"
      />
    );
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('renders TransactionCard props', () => {
    render(
      <TransactionCard
        transaction={{
          id: 't1',
          pocketId: 'p1',
          userId: 'u1',
          type: 'expense',
          category: 'Groceries',
          description: 'Milk',
          amount: 12,
          date: new Date('2026-02-20T10:00:00.000Z'),
          createdAt: new Date('2026-02-20T10:00:00.000Z'),
        }}
        userName="Alex"
      />
    );
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('shows signup validation message for mismatched passwords', async () => {
    render(<AuthForm mode="signup" onToggleMode={() => undefined} />);
    fireEvent.change(screen.getByPlaceholderText('name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'Password123!@#456' } });
    fireEvent.change(screen.getByPlaceholderText('confirmPassword'), { target: { value: 'Password123!@#999' } });
    fireEvent.click(screen.getByLabelText(/terms/i));
    fireEvent.submit(screen.getByRole('button', { name: 'signUp' }));
    expect(await screen.findByText('errors.passwordMismatch')).toBeInTheDocument();
  });
});
