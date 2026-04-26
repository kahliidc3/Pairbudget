import { describe, expect, it, vi } from 'vitest';
import { usePocketStore } from '@/store/pocketStore';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('pocketStore', () => {
  it('sets and clears pocket data', () => {
    usePocketStore.setState({ currentPocket: null, transactions: [], loading: false });

    usePocketStore.getState().setCurrentPocket({
      id: 'p1',
      name: 'Pocket 1',
      participants: ['u1'],
      roles: { u1: 'provider' },
      balance: 0,
      totalFunded: 0,
      totalSpent: 0,
      createdAt: new Date(),
    });
    expect(usePocketStore.getState().currentPocket?.id).toBe('p1');

    usePocketStore.getState().addTransaction({
      id: 't1',
      pocketId: 'p1',
      userId: 'u1',
      type: 'fund',
      category: 'Other',
      description: 'Seed',
      amount: 100,
      date: new Date(),
      createdAt: new Date(),
    });
    expect(usePocketStore.getState().transactions).toHaveLength(1);

    usePocketStore.getState().clearPocketData();
    expect(usePocketStore.getState().currentPocket).toBeNull();
    expect(usePocketStore.getState().transactions).toHaveLength(0);
  });
});
