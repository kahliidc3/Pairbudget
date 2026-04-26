import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/store/authStore';

describe('authStore', () => {
  it('updates auth state and resets correctly', () => {
    useAuthStore.setState({ user: null, userProfile: null, loading: true });

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);

    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().userProfile).toBeNull();
    expect(useAuthStore.getState().loading).toBe(false);

    useAuthStore.getState().reset();
    expect(useAuthStore.getState().loading).toBe(true);
  });
});
