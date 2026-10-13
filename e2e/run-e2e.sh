#!/usr/bin/env bash
# Lance les tests E2E Dokimo contre l'app DÉJÀ DÉPLOYÉE.
#
# Les identifiants ne sont jamais versionnés ni écrits sur disque : ils sont lus
# dans l'environnement du conteneur Dokimo (source de vérité) et exportés au process Playwright.
#
# Usage :
#   bash e2e/run-e2e.sh                       # cible la prod (E2E_BASE_URL par défaut)
#   E2E_BASE_URL=http://localhost:18092 bash e2e/run-e2e.sh   # cible un conteneur de test
#   E2E_ALLOW_WRITE=1 bash e2e/run-e2e.sh     # autorise les specs qui écrivent (jamais sur la prod)
set -euo pipefail

BASE="${E2E_BASE_URL:-http://192.168.3.102:8092}"
CONTAINER="${DOKIMO_CONTAINER:-2510-dokimo2}"

if [ -z "${E2E_AUTH_EMAIL:-}" ]; then
  E2E_AUTH_EMAIL="$(docker exec "$CONTAINER" printenv AUTH_EMAIL)"
fi
if [ -z "${E2E_AUTH_PASSWORD:-}" ]; then
  E2E_AUTH_PASSWORD="$(docker exec "$CONTAINER" printenv AUTH_PASSWORD)"
fi
export E2E_AUTH_EMAIL E2E_AUTH_PASSWORD E2E_BASE_URL="$BASE"

if [ -z "$E2E_AUTH_EMAIL" ] || [ -z "$E2E_AUTH_PASSWORD" ]; then
  echo "ERREUR : identifiants introuvables (AUTH_EMAIL/AUTH_PASSWORD absents du conteneur $CONTAINER)" >&2
  exit 2
fi

echo "E2E Dokimo -> $E2E_BASE_URL (utilisateur: masqué)"
exec npx playwright test --config e2e/playwright.config.ts "$@"
