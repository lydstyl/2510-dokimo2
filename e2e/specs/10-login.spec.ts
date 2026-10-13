import { test, expect } from '@playwright/test';
import { login, trackConsoleErrors } from '../helpers';

test.describe('authentification', () => {
  test('les identifiants valides ouvrent le dashboard', async ({ page }) => {
    const erreurs = trackConsoleErrors(page);

    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).not.toBeEmpty();

    const inattendues = erreurs.filter((e) => !e.includes('401'));
    expect(inattendues, `erreurs console inattendues : ${inattendues.join(' | ')}`).toHaveLength(0);
  });

  test('un mot de passe faux est refusé et reste sur /login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', process.env.E2E_AUTH_EMAIL as string);
    await page.fill('#password', 'ce-n-est-pas-le-bon-mot-de-passe');
    await page.click('button[type="submit"]');

    // Message d'erreur affiché, aucune redirection vers le dashboard.
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
