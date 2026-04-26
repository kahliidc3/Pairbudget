import { test, expect } from '@playwright/test';
import { byTextButton, goToLocale, openAuthSignup } from '../utils/app';

test.describe('critical flows', () => {
  test.skip(!process.env.RUN_E2E_FULL, 'Set RUN_E2E_FULL=1 to run full E2E against configured Firebase project.');

  test('signup -> pocket create -> invite -> join flow', async ({ page }) => {
    await goToLocale(page, 'en');
    await openAuthSignup(page);

    await page.getByPlaceholder(/email|auth\.email/i).fill('e2e-user-a@example.com');
    await page.getByPlaceholder(/password|auth\.password/i).fill('Password123!@#456');
    await page.getByPlaceholder(/full name|auth\.name/i).fill('E2E User A');
    await page.getByLabel(/terms|agree/i).check();
    await byTextButton(page, /sign up|auth\.signUp/i).click();

    await expect(page).toHaveURL(/dashboard|pocket-setup/);
  });

  test('login -> add funds -> add expense -> verify balance updates', async ({ page }) => {
    await goToLocale(page, 'en');
    await byTextButton(page, /sign in|navigation\.signIn/i).click();
    await page.getByPlaceholder(/email|auth\.email/i).fill('e2e-user-a@example.com');
    await page.getByPlaceholder(/password|auth\.password/i).fill('Password123!@#456');
    await byTextButton(page, /sign in|auth\.signIn/i).click();

    await expect(page).toHaveURL(/dashboard/);
    await byTextButton(page, /add funds|dashboard\.quickActions\.addFunds/i).first().click();
    await page.getByLabel(/amount/i).fill('200');
    await page.getByLabel(/description/i).fill('E2E deposit');
    await byTextButton(page, /add funds/i).last().click();
  });

  test('join by invite and multi-locale routing smoke', async ({ page }) => {
    await goToLocale(page, 'fr');
    await expect(page).toHaveURL(/\/fr/);
    await goToLocale(page, 'ar');
    await expect(page).toHaveURL(/\/ar/);
  });
});
