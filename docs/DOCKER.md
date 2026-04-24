# Docker — Guide d'utilisation

Ce projet peut être lancé dans Docker en mode **développement** (hot reload) ou en mode **production** (build optimisé).

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20
- Un fichier `.env` à la racine du projet (copier `.env.example` et remplir les valeurs)

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

---

## Mode développement

Le mode développement monte les sources en volume pour obtenir le **hot reload**.

### Lancer

```bash
docker compose --profile dev up
```

L'application est accessible sur **http://localhost:3000**.

### Premier lancement

Au démarrage, le conteneur applique automatiquement les migrations Prisma sur la base SQLite locale (`./prisma/dev.db`). Si le fichier n'existe pas, il est créé.

### Rebuild après changement de dépendances

Si vous modifiez `package.json` (ajout/suppression de paquets), reconstruisez l'image :

```bash
docker compose --profile dev up --build
```

### Créer une nouvelle migration

```bash
docker compose --profile dev exec dev npx prisma migrate dev --name nom_de_la_migration
```

### Arrêter

```bash
docker compose --profile dev down
```

---

## Mode production

Le mode production compile l'application et la lance avec `next start`.

### Lancer

```bash
docker compose --profile prod up -d
```

L'application est accessible sur **http://localhost:3000**.

La base de données est stockée dans un volume Docker nommé `db-prod` (persistant entre les redémarrages).

> **Note** : En production, `DATABASE_URL` est automatiquement surchargé vers `file:/app/data/production.db` (volume Docker). La valeur dans `.env` est ignorée pour la base de production.

### Rebuild après modification du code

```bash
docker compose --profile prod up --build -d
```

### Arrêter

```bash
docker compose --profile prod down
```

### Supprimer aussi la base de données de production

```bash
docker compose --profile prod down -v
```

---

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | Chemin vers la base SQLite | `file:./prisma/dev.db` |
| `AUTH_EMAIL` | Email de connexion | `admin@example.com` |
| `AUTH_PASSWORD` | Mot de passe (en clair, hashé au seed) | `monmotdepasse` |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `une-chaine-aleatoire-longue` |
| `NODE_ENV` | Environnement | `development` / `production` |

En production Docker, `DATABASE_URL` est surchargé par `docker-compose.yml` — inutile de le modifier dans `.env`.

---

## Opérations courantes

### Ouvrir un shell dans le conteneur

```bash
# Dev
docker compose --profile dev exec dev sh

# Prod
docker compose --profile prod exec prod sh
```

### Voir les logs

```bash
# Dev (avec suivi)
docker compose --profile dev logs -f

# Prod
docker compose --profile prod logs -f
```

### Appliquer les migrations manuellement

```bash
# Dev
docker compose --profile dev exec dev npx prisma migrate deploy

# Prod
docker compose --profile prod exec prod npx prisma migrate deploy
```

### Lancer les tests (dev uniquement)

```bash
docker compose --profile dev exec dev npm test
```

### Accéder à Prisma Studio (dev uniquement)

Prisma Studio nécessite un port supplémentaire. Lancez-le directement :

```bash
docker compose --profile dev exec dev npx prisma studio
```

Puis exposez le port 5555 si besoin en ajoutant `"5555:5555"` dans les ports du service `dev`.

---

## Architecture des conteneurs

```
Dockerfile (multi-stage)
├── base          — Node 22 slim + outils de compilation (python3, make, g++)
├── deps          — npm ci (toutes dépendances)
├── prod-deps     — npm ci --omit=dev (dépendances de production uniquement)
├── development   — Sources copiées + prisma generate → CMD: migrate + npm run dev
├── builder       — Sources copiées + prisma generate + npm run build
└── production    — Build .next + prod-deps → CMD: migrate + npm start
```

### Volumes

| Volume | Mode | Contenu |
|---|---|---|
| `./src` | Dev | Code source (hot reload) |
| `./prisma` | Dev | Base SQLite + migrations |
| `./messages` | Dev | Traductions i18n |
| `./public` | Dev | Fichiers statiques |
| `db-prod` (nommé) | Prod | Base SQLite de production |
| `next-dev-cache` (nommé) | Dev | Cache de build Next.js |

---

## Résolution de problèmes

### Le hot reload ne fonctionne pas

Vérifiez que les volumes sont bien montés :

```bash
docker compose --profile dev ps
```

Si les sources ne sont pas détectées, forcez le polling dans `next.config.ts` :

```ts
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.watchOptions = { poll: 1000, aggregateTimeout: 300 };
    return config;
  },
};
```

### Erreur de migration au démarrage

Si la base de données est dans un état incohérent :

```bash
# Réinitialiser la base de dev (perd les données !)
docker compose --profile dev exec dev npx prisma migrate reset
```

### Reconstruire complètement sans cache

```bash
docker compose --profile dev build --no-cache
# ou
docker compose --profile prod build --no-cache
```
