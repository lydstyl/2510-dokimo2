import { Page, expect } from '@playwright/test';

export const LEASE_ID_APPARTEMENT_5 = '4ea8b533-12ac-4f1f-86ef-d293ad9427ef';

/** Connexion via le formulaire réel (/login). Les identifiants viennent de l'environnement. */
export async function login(page: Page): Promise<void> {
  const email = process.env.E2E_AUTH_EMAIL;
  const password = process.env.E2E_AUTH_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'E2E_AUTH_EMAIL / E2E_AUTH_PASSWORD non définis — lancer via `bash e2e/run-e2e.sh` (les lit dans le conteneur Dokimo).'
    );
  }

  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await expect(page, 'le login doit mener au dashboard').toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

/** Corps de PATCH reconstruit à partir d'un bail lu par l'API (aucune donnée en dur). */
export function patchBodyFrom(lease: Record<string, unknown>, tenantIds: string[]) {
  return {
    propertyId: lease.propertyId,
    tenantIds,
    startDate: lease.startDate,
    endDate: lease.endDate,
    rentAmount: lease.rentAmount,
    chargesAmount: lease.chargesAmount,
    paymentDueDay: lease.paymentDueDay,
    irlQuarter: lease.irlQuarter ?? '',
    note: lease.note ?? '',
  };
}

/** Collecte les erreurs console pour les specs qui vérifient aussi l'absence de JS cassé. */
export function trackConsoleErrors(page: Page): string[] {
  const erreurs: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text());
  });
  page.on('pageerror', (e) => erreurs.push(`pageerror: ${e.message}`));
  return erreurs;
}
