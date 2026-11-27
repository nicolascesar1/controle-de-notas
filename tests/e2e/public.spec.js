import { expect, test } from '@playwright/test';

test('redireciona usuário não autenticado para login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /controle de notas/i })).toBeVisible();
  await expect(page.getByPlaceholder('seu@email.com')).toBeVisible();
  await expect(page.getByPlaceholder('••••••••')).toBeVisible();
});
