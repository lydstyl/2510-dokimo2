import { test, expect } from '@playwright/test';
import { login, patchBodyFrom, LEASE_ID_APPARTEMENT_5 } from '../helpers';

/**
 * Cas NOMINAL du PATCH de bail : il ÉCRIT (deleteMany + create des jointures).
 * Désactivé par défaut : ne tourne que contre une base de test
 * (`E2E_ALLOW_WRITE=1` + conteneur jetable sur une COPIE de la base).
 *
 * Usage :
 *   E2E_ALLOW_WRITE=1 E2E_BASE_URL=http://localhost:18092 bash e2e/run-e2e.sh
 */
test.describe('PATCH de bail : cas nominal (écriture)', () => {
  test.skip(
    process.env.E2E_ALLOW_WRITE !== '1',
    'écriture désactivée (protection de la base de production) — voir e2e/run-e2e.sh'
  );

  test('renvoyer les mêmes locataires laisse le bail identique et lisible', async ({ page }) => {
    await login(page);
    const api = page.request;

    const avant = await api.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}`);
    expect(avant.status()).toBe(200);
    const bail = (await avant.json()) as Record<string, unknown> & { tenantIds: string[] };
    const vraisIds = [...bail.tenantIds].sort();

    const reponse = await api.patch(`/api/leases/${LEASE_ID_APPARTEMENT_5}`, {
      data: patchBodyFrom(bail, vraisIds),
    });
    expect(reponse.status(), 'un PATCH valide doit répondre 200').toBe(200);
    const maj = (await reponse.json()) as { tenantIds?: string[]; rentAmount?: unknown };
    expect([...(maj.tenantIds ?? [])].sort()).toEqual(vraisIds);

    const apres = await api.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}`);
    expect(apres.status()).toBe(200);
    const final = (await apres.json()) as Record<string, unknown> & { tenantIds: string[] };
    expect([...final.tenantIds].sort()).toEqual(vraisIds);
    for (const champ of ['propertyId', 'startDate', 'endDate', 'rentAmount', 'chargesAmount', 'paymentDueDay']) {
      expect(final[champ], `champ ${champ} inchangé`).toEqual(bail[champ]);
    }
  });
});
