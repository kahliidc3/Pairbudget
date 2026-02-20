import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockUpdateProfile = vi.fn();

const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockDoc = vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id }));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signOut: mockFirebaseSignOut,
  updateProfile: mockUpdateProfile,
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  getDocs: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  deleteDoc: vi.fn(),
  setDocRef: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
  deleteField: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('@/lib/rateLimiter', () => ({
  enforceRateLimit: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('signIn returns firebase user', async () => {
    const mockUser = { uid: 'u1' };
    mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    const { signIn } = await import('@/services/authService');

    const user = await signIn('test@example.com', 'password');
    expect(user).toEqual(mockUser);
  });

  it('signOut delegates to firebase signOut', async () => {
    mockFirebaseSignOut.mockResolvedValue(undefined);
    const { signOut } = await import('@/services/authService');

    await signOut();
    expect(mockFirebaseSignOut).toHaveBeenCalledTimes(1);
  });

  it('getUserProfile returns mapped user with date', async () => {
    const now = new Date('2026-02-20T10:00:00.000Z');
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'u1',
        name: 'Test',
        email: 'test@example.com',
        pocketIds: [],
        createdAt: { toDate: () => now },
      }),
    });
    const { getUserProfile } = await import('@/services/authService');

    const profile = await getUserProfile('u1');
    expect(profile?.uid).toBe('u1');
    expect(profile?.createdAt).toEqual(now);
  });

  it('signUp returns created user and profile', async () => {
    const deleteSpy = vi.fn();
    const firebaseUser = { uid: 'u1', delete: deleteSpy };
    mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser });
    mockUpdateProfile.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const { signUp } = await import('@/services/authService');
    const result = await signUp('test@example.com', 'Password123!@#', 'Test User', 'en');

    expect(result.user).toEqual(firebaseUser);
    expect(result.userProfile.name).toBe('Test User');
    expect(mockSetDoc).toHaveBeenCalled();
  });
});
