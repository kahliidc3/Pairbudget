import { test, expect } from '@playwright/test';
import { byTextButton, goToLocale } from '../utils/app';

test.describe('error paths', () => {
  test.skip(!process.env.RUN_E2E_FULL, 'Set RUN_E2E_FULL=1 to run full E2E against configured Firebase project.');

  test('shows invalid credentials error', async ({ page }) => {
    await goToLocale(page, 'en');
    await byTextButton(page, /sign in|navigation\.signIn/i).click();
    await page.getByPlaceholder(/email|auth\.email/i).fill('unknown-user@example.com');
    await page.getByPlaceholder(/password|auth\.password/i).fill('wrong-password');
    await byTextButton(page, /sign in|auth\.signIn/i).click();
    await expect(page.getByText(/invalid|wrong|error/i)).toBeVisible();
  });

  test('handles invalid invite code path', async ({ page }) => {
    await page.goto('/en/join?code=BAD999');
    await expect(page.getByText(/invalid invite|unable to join|error/i)).toBeVisible();
  });

  test('network disruption surfaces retry path', async ({ page, context }) => {
    await goToLocale(page, 'en');
    await context.setOffline(true);
    await byTextButton(page, /sign in|navigation\.signIn/i).click();
    await page.getByPlaceholder(/email|auth\.email/i).fill('offline@example.com');
    await page.getByPlaceholder(/password|auth\.password/i).fill('Password123!');
    await byTextButton(page, /sign in|auth\.signIn/i).click();
    await expect(page.getByText(/error|retry|network/i)).toBeVisible();
    await context.setOffline(false);
  });
});
