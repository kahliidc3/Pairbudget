import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetDoc = vi.fn();
const mockDoc = vi.fn((_arg1?: unknown, _arg2?: unknown, id?: string) => ({ id: id ?? 'generated-id' }));
const mockCollection = vi.fn(() => ({}));
const mockQuery = vi.fn(() => ({}));
const mockWhere = vi.fn(() => ({}));
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn();
const mockRunTransaction = vi.fn();
const mockGetDoc = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  runTransaction: mockRunTransaction,
  getDoc: mockGetDoc,
  onSnapshot: mockOnSnapshot,
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  increment: vi.fn((value: number) => value),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  getSubscriptionHealthState: vi.fn(() => 'healthy'),
  handleFirebaseInternalError: vi.fn(async () => false),
  resetRecoveryTracking: vi.fn(),
}));

vi.mock('@/lib/secureRandom', () => ({
  generateSecureRandomString: vi.fn(() => 'ABC123'),
}));

vi.mock('@/lib/rateLimiter', () => ({
  enforceRateLimit: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('pocketService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('createPocket creates pocket and persists it', async () => {
    const { createPocket } = await import('@/services/pocketService');

    const pocket = await createPocket('Family Budget', 'user-1', 'provider');
    expect(pocket.name).toBe('Family Budget');
    expect(pocket.inviteCode).toBe('ABC123');
    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('joinPocket throws invalid invite code when pocket not found', async () => {
    mockGetDocs.mockResolvedValue({ empty: true });
    const { joinPocket } = await import('@/services/pocketService');

    await expect(joinPocket('BAD999', 'user-1', 'spender')).rejects.toThrow('Invalid invite code');
  });

  it('addTransaction rejects invalid amount', async () => {
    const { addTransaction } = await import('@/services/pocketService');

    await expect(
      addTransaction('pocket-1', 'user-1', 'expense', 'Food', 'Too much', -1)
    ).rejects.toThrow('Invalid transaction amount');
  });
});
