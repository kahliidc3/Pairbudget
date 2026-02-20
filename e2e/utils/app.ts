import { type Locator, type Page, expect } from '@playwright/test';

export const byTextButton = (page: Page, text: string | RegExp): Locator =>
  page.getByRole('button', { name: text });

export const goToLocale = async (page: Page, locale = 'en') => {
  await page.goto(`/${locale}`);
  await expect(page).toHaveURL(new RegExp(`/${locale}`));
};

export const openAuthSignup = async (page: Page) => {
  await byTextButton(page, /get started|start/i).first().click();
  await expect(page.getByRole('heading', { name: /sign up|auth\.signUp/i })).toBeVisible();
};
