import { expect, test } from '@playwright/test';
import { canLogin, canMutate, login, uniqueName } from './helpers';

const openMobileMenu = async (page) => {
  await page.getByRole('button', { name: /abrir menu|^menu$/i }).last().click();
  return page.locator('.mobile-drawer');
};

const goToSettings = async (page, isMobile) => {
  if (isMobile) {
    const drawer = await openMobileMenu(page);
    await drawer.getByRole('link', { name: /configurações/i }).click();
    return;
  }

  await page.getByRole('link', { name: /configurações/i }).click();
};

test.describe('fluxos autenticados', () => {
  test.skip(!canLogin, 'Defina E2E_EMAIL e E2E_PASSWORD em .env.e2e para rodar testes autenticados.');

  test('login, painel, navegação e busca global', async ({ page, isMobile }) => {
    await login(page);

    await expect(page.getByRole('heading', { name: /painel/i })).toBeVisible();

    if (isMobile) {
      let drawer = await openMobileMenu(page);
      await expect(drawer.getByRole('link', { name: /notas/i })).toBeVisible();
      await drawer.getByRole('button', { name: /fechar menu/i }).click();
      drawer = await openMobileMenu(page);
      await expect(drawer.getByRole('link', { name: /configurações/i })).toBeVisible();
      await page.keyboard.press('Escape');
    } else {
      await expect(page.getByRole('link', { name: /notas/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /fornecedores/i })).toBeVisible();
    }

    await page.getByLabel('Busca global').fill('zzzz-e2e-sem-resultado');
    await expect(page.getByText(/nenhum resultado encontrado|não foi possível buscar|digite pelo menos/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('configurações exibem exportação e backup', async ({ page, isMobile }) => {
    await login(page);
    await goToSettings(page, isMobile);
    await expect(page.getByRole('heading', { name: /configurações/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /exportar planilha/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /backup técnico/i })).toBeVisible();
    await expect(page.getByText(/restaurar backup/i)).toBeVisible();
  });

  test('cria fornecedor, nota e registra pagamento', async ({ page }) => {
    test.skip(!canMutate, 'Defina E2E_RUN_MUTATIONS=1 para permitir criação de dados reais no Firebase.');

    const supplierName = uniqueName('Fornecedor E2E');

    await login(page);

    await page.getByRole('link', { name: /fornecedores/i }).click();
    await page.getByRole('button', { name: /novo fornecedor/i }).click();
    await page.getByPlaceholder(/coca-cola/i).fill(supplierName);
    await page.getByPlaceholder(/joão da silva/i).fill('Teste E2E');
    await page.getByPlaceholder(/\(00\) 00000-0000/i).fill('(84) 99999-0000');
    await page.getByPlaceholder(/contato@fornecedor.com/i).fill('teste-e2e@example.com');
    await page.getByRole('button', { name: /^salvar$/i }).click();
    await expect(page.getByText(supplierName)).toBeVisible();

    await page.getByRole('link', { name: /^notas$/i }).click();
    await page.getByRole('button', { name: /nova nota fiscal/i }).click();
    await page.locator('select[name="supplier_id"]').selectOption({ label: supplierName });
    await page.locator('input[name="total_value"]').fill('123.45');
    await page.locator('select[name="installments_count"]').selectOption('2');
    await page.getByRole('button', { name: /gerar contas/i }).click();
    await expect(page.getByText(/nota fiscal salva/i)).toBeVisible();
    await expect(page.getByText(supplierName)).toBeVisible();

    await page.getByRole('link', { name: /painel/i }).click();
    await expect(page.getByRole('heading', { name: /painel/i })).toBeVisible();
    await expect(page.getByText(supplierName).first()).toBeVisible();
    await page.getByRole('button', { name: /pendente/i }).first().click();
    await expect(page.getByRole('heading', { name: /registrar pagamento/i })).toBeVisible();
    await page.getByRole('button', { name: /confirmar pagamento/i }).click();
    await expect(page.getByText(/pagamento registrado/i)).toBeVisible();
  });
});
