import { expect } from '@playwright/test';

export const e2eCredentials = {
  email: process.env.E2E_EMAIL,
  password: process.env.E2E_PASSWORD,
};

export const canLogin = Boolean(e2eCredentials.email && e2eCredentials.password);
export const canMutate = canLogin && process.env.E2E_RUN_MUTATIONS === '1';

export const login = async (page) => {
  await page.goto('/login');
  await page.getByPlaceholder('seu@email.com').fill(e2eCredentials.email);
  await page.getByPlaceholder('••••••••').fill(e2eCredentials.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('heading', { name: /painel/i })).toBeVisible();
};

export const uniqueName = (prefix) => `${prefix} ${Date.now()}`;
