import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAuthCache, formatCurrency, formatDate, generateInviteLink } from '@/lib/utils';

describe('utils', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('formats currency with locale and currency', () => {
    const formatted = formatCurrency(1234.5, { locale: 'fr-FR', currency: 'EUR' });
    expect(formatted).toContain('1');
    expect(formatted).toContain('€');
  });

  it('formats date with locale', () => {
    const date = new Date('2026-02-20T10:30:00.000Z');
    const formatted = formatDate(date, 'en-US');
    expect(formatted).toContain('2026');
  });

  it('generates locale-aware invite link from app url', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pairbudget.app');
    const link = generateInviteLink('ABC123', 'fr');
    expect(link).toMatch(/\/fr\/join\?code=ABC123$/);
  });

  it('clears auth cache safely', () => {
    window.localStorage.setItem('firebase:authUser', 'x');
    window.sessionStorage.setItem('firebase:redirect', 'y');
    document.cookie = 'firebase-auth=abc';

    clearAuthCache();

    expect(window.localStorage.getItem('firebase:authUser')).toBeNull();
    expect(window.sessionStorage.getItem('firebase:redirect')).toBeNull();
  });
});
