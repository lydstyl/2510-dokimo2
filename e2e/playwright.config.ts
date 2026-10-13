import { defineConfig, devices } from '@playwright/test';

/**
 * Harnais E2E Dokimo — cible l'app **déjà déployée** (E2E_BASE_URL), jamais un dev server :
 * on valide l'artefact réellement buildé, pas le code source.
 *
 * Identifiants : E2E_AUTH_EMAIL / E2E_AUTH_PASSWORD, jamais en dur ni versionnés.
 * `e2e/run-e2e.sh` les lit dans l'environnement du conteneur Dokimo.
 *
 * Réglages volontairement conservateurs (1 worker, 1 retry, trace au 1er échec) pour que
 * ces tests ne soient jamais flaky : ils servent de gate de non-régression.
 */
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['line']],
  outputDir: './test-results',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://192.168.3.102:8092',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
