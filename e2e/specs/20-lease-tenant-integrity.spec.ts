import { test, expect } from '@playwright/test';
import { login, patchBodyFrom, LEASE_ID_APPARTEMENT_5 } from '../helpers';

/**
 * NON-RÉGRESSION du bug du 13/10/2026 : `PATCH /api/leases/<id>` faisait
 * `deleteMany` (jointures locataires) PUIS `create` hors transaction. Quand le `create`
 * échouait (tenantId composite/inconnu → contrainte FK), la suppression subsistait :
 * le bail se retrouvait SANS locataire, donc illisible (`At least one tenant is required`),
 * donc quittance impossible — en silence.
 *
 * Ces tests sont en LECTURE SEULE sur la prod : ils n'envoient que des PATCH qui DOIVENT être
 * refusés. Un refus qui abîme le bail est précisément ce qu'on interdit.
 */

type LeaseApi = Record<string, unknown> & {
  tenantIds?: string[];
  tenants: Array<{ id: string; tenantId: string }>;
};

test.describe("intégrité du bail : un PATCH refusé ne doit jamais vider les locataires", () => {
  test('le GET expose les vrais ids attendus par le PATCH (tenantIds), en plus de tenants[]', async ({ page }) => {
    await login(page);
    const reponse = await page.request.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}`);
    expect(reponse.status(), 'GET du bail').toBe(200);

    const bail = (await reponse.json()) as LeaseApi;
    expect(Array.isArray(bail.tenantIds), 'le GET doit exposer tenantIds').toBe(true);
    expect(
      [...(bail.tenantIds ?? [])].sort(),
      'tenantIds doit correspondre aux jointures (pas les ids composites)'
    ).toEqual(bail.tenants.map((t) => t.tenantId).sort());
    expect(bail.tenants.length, 'le bail de référence a des locataires').toBeGreaterThan(0);
  });

  test('un PATCH avec les ids composites du GET est refusé et le bail reste intact', async ({ page }) => {
    await login(page);
    const api = page.request;

    // 1. état initial (tolérant : on accepte un GET sans tenantIds, c'est l'invariant qui compte)
    const avant = await api.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}`);
    expect(avant.status(), 'GET du bail').toBe(200);
    const bail = (await avant.json()) as LeaseApi;
    const vraisIds = [...(bail.tenantIds ?? bail.tenants.map((t) => t.tenantId))].sort();
    expect(vraisIds.length, 'le bail de référence doit avoir des locataires AVANT le test').toBeGreaterThan(0);
    const idsComposites = bail.tenants.map((t) => t.id); // <leaseId>_<tenantId> : NE PAS les renvoyer
    expect(idsComposites.length, 'jointures présentes').toBeGreaterThan(0);

    // 2. le scénario exact du 13/10/2026 : les ids composites renvoyés par le GET
    const refuse = await api.patch(`/api/leases/${LEASE_ID_APPARTEMENT_5}`, {
      data: patchBodyFrom(bail, idsComposites),
    });
    expect(refuse.status(), 'un tenantId composite doit être refusé (400)').toBe(400);
    const message = ((await refuse.json()) as { error?: string }).error ?? '';
    expect(message, 'message métier explicite').toMatch(/^Unknown tenant id:/);

    // 3. L'ASSERTION QUI COMPTE : le bail est toujours lisible, avec ses locataires
    const apres = await api.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}`);
    expect(apres.status(), 'le bail doit rester lisible après un PATCH refusé').toBe(200);
    const bailApres = (await apres.json()) as LeaseApi;
    expect([...(bailApres.tenantIds ?? bailApres.tenants.map((t) => t.tenantId))].sort(), 'locataires intacts').toEqual(
      vraisIds
    );
    expect(bailApres.tenants.length, 'aucune jointure perdue').toBe(bail.tenants.length);

    // 4. un tenantId inexistant est refusé de la même façon, sans rien casser
    const inconnu = '00000000-dead-beef-0000-000000000000';
    const refuse2 = await api.patch(`/api/leases/${LEASE_ID_APPARTEMENT_5}`, {
      data: patchBodyFrom(bail, [vraisIds[0], inconnu]),
    });
    expect(refuse2.status()).toBe(400);
    expect(((await refuse2.json()) as { error?: string }).error).toBe(`Unknown tenant id: ${inconnu}`);

    // 5. un doublon de tenantId est refusé tôt (400), pas par la base (500)
    const doublon = await api.patch(`/api/leases/${LEASE_ID_APPARTEMENT_5}`, {
      data: patchBodyFrom(bail, [vraisIds[0], vraisIds[0]]),
    });
    expect(doublon.status()).toBe(400);
    expect(((await doublon.json()) as { error?: string }).error).toBe(`Duplicated tenant id: ${vraisIds[0]}`);

    // 6. état final identique à l'état initial
    const final = await api.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}`);
    expect(final.status()).toBe(200);
    const bailFinal = (await final.json()) as LeaseApi;
    expect([...(bailFinal.tenantIds ?? bailFinal.tenants.map((t) => t.tenantId))].sort()).toEqual(vraisIds);

    // 7. la quittance reste générable (c'est ce que cassait le bail vidé)
    const quittance = await api.get(`/api/leases/${LEASE_ID_APPARTEMENT_5}/receipts-pdf?month=2026-10`);
    expect(quittance.status(), 'quittance PDF').toBe(200);
    expect(quittance.headers()['content-type']).toContain('application/pdf');
  });

  test('la page paiements du bail reste consultable', async ({ page }) => {
    await login(page);
    const reponse = await page.goto(`/dashboard/leases/${LEASE_ID_APPARTEMENT_5}/payments`, {
      waitUntil: 'domcontentloaded',
    });
    expect(reponse?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/Paiements|LOYER DÛ|Dû/i, { timeout: 20_000 });
  });
});
