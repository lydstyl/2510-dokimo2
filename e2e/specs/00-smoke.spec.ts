import { test, expect } from '@playwright/test';
import { trackConsoleErrors } from '../helpers';

/**
 * SMOKE — l'app répond, boote, et n'a pas de JS cassé au chargement.
 * L'app est protégée par auth : la page publique est /login (la racine redirige).
 */
test('smoke : /login répond, rend du contenu et ne casse pas la console', async ({ page }) => {
  const erreurs = trackConsoleErrors(page);

  const reponse = await page.goto('/login', { waitUntil: 'domcontentloaded' });
  expect(reponse?.status(), 'HTTP status de /login').toBe(200);

  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(10);

  // Les 401 attendus (auth applicative) ne comptent pas comme régression.
  const inattendues = erreurs.filter((e) => !e.includes('401'));
  expect(inattendues, `erreurs console inattendues : ${inattendues.join(' | ')}`).toHaveLength(0);
});

test("smoke : le dashboard exige une session", async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page, 'sans session on doit atterrir sur /login').toHaveURL(/\/login/);
});
