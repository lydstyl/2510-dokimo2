# DEPENDENCIES_MIGRATION.md

Migrations de dépendances — application 2510-dokimo2 (rental-management)

Date : 05/08/2026
Branche : feature/mise-jour-compl-te-des-d-pendances-npm-npm-update-

## Résumé

Mise à jour complète des dépendances npm : `npm update` (in-range) puis bumps
majeurs un par un, avec `npm test` après chaque bump. **Le contrat = les tests
existants (254 tests / 41 suites) — tout est resté vert.**

## Bumps majeurs effectués (root)

| Paquet | Avant | Après | Notes |
|--------|-------|-------|-------|
| typescript | ^6 (6.0.3) | ^7.0.2 | TS 7 : compatible avec la base de code, aucun changement requis hors tests |
| better-sqlite3 | ^12.9.0 (12.11.1) | ^13.0.3 | API native compatible ; Prisma 7.9 + adapter OK |
| @types/node | ^25 (25.9.5) | ^26.1.2 | Types Node 26, tests verts |

## Bumps majeurs effectués (mcp-server)

| Paquet | Avant | Après | Notes |
|--------|-------|-------|-------|
| zod | ^3.24.0 | ^4.4.3 | Zod 4 : migration réussie, SDK MCP 1.30 compatible (dédoublonné) |
| typescript | ^5.8.0 | ^6.0.3 | tsconfig : `module`/`moduleResolution` → `NodeNext` requis par TS 6 |
| @modelcontextprotocol/sdk | ^1.29.0 | 1.30.0 | Mise à jour in-range suite à npm update |

## Adaptations nécessaires

1. **Tests (4 fichiers)** — adaptation aux nouvelles interfaces de types :
   - `CalculateMonthlyPaymentHistory.test.ts` : suppression de `updatedAt` et
     `update/delete` des mocks (champs non présents sur les nouveaux types).
   - `ProrataCalculation.test.ts` : accès `Money` via `getAmount()` au lieu du
     champ public `.amount`.
   - `ReceiptConsistency.integration.test.ts`, `RecordPayment.test.ts` :
     ajustements mineurs de types.
2. **mcp-server/tsconfig.json** : `module: NodeNext` + `moduleResolution: NodeNext`
   (requis par TypeScript 6 pour l'import d'ESM/CJS).
3. **Prisma client** : régénéré (`npx prisma generate`) — la suite
   d'intégration ReceiptConsistency en dépendait (baseline cassée avant le pipeline).

## Migrations déjà en place (pas de bump requis)

| Paquet | Version | Statut |
|--------|---------|--------|
| Next.js | 16.x | déjà sur Next 16 |
| Prisma | 7.x | déjà sur Prisma 7 |
| Tailwind CSS | 4.x | déjà sur Tailwind 4 (CSS-first) |
| React | 19.x | déjà sur React 19 |
| Vitest | 4.x | déjà sur Vitest 4 |

## Bloqué / différé

Aucun. Tous les bumps candidats ont abouti avec tests verts.

## Commandes de vérification

```bash
npm test                 # 254 tests / 41 suites — vert
npm run build            # Next.js build — OK
cd mcp-server && npm run build   # esbuild — OK
```
