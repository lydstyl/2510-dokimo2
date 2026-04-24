# Docker — Guide d'utilisation

Ce projet peut être lancé dans Docker en mode **développement** (hot reload) ou en mode **production** (build optimisé).

## Prérequis

- [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.20 (inclus avec Docker Engine via `docker-compose-plugin`)
- Un fichier `.env` à la racine du projet (copier `.env.example` et remplir les valeurs)

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### Installation Docker sur Pop!_OS / Ubuntu

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Utiliser Docker sans sudo
sudo usermod -aG docker $USER
newgrp docker
```

> **Espace disque** : Docker stocke ses données dans `/var/lib/docker` (sur la partition `/`). Si `/` est petite, déplacez Docker vers `/home` :
> ```bash
> sudo systemctl stop docker docker.socket
> sudo mkdir -p /home/docker-data
> echo '{ "data-root": "/home/docker-data" }' | sudo tee /etc/docker/daemon.json
> sudo rsync -aP /var/lib/docker/ /home/docker-data/
> sudo systemctl start docker
> sudo rm -rf /var/lib/docker
> ```

---

## Mode développement

Le mode développement monte les sources en volume pour obtenir le **hot reload**.

### Lancer

```bash
docker compose --profile dev up
```

L'application est accessible sur **http://localhost:3000**.

Le hot reload est actif — toute modification dans `src/` est prise en compte immédiatement sans rebuild.

### Premier lancement

Au démarrage, le conteneur applique automatiquement les migrations Prisma sur la base SQLite locale (`./prisma/dev.db`). Si le fichier n'existe pas, il est créé.

### Arrêter

```bash
docker compose --profile dev down
```

### Rebuild après changement de dépendances

Si vous modifiez `package.json` (ajout/suppression de paquets) :

```bash
docker compose --profile dev up --build
```

### Créer une nouvelle migration

```bash
docker compose --profile dev exec dev npx prisma migrate dev --name nom_de_la_migration
```

---

## Mode production

Le mode production compile l'application et la lance avec `next start`.

### Lancer

```bash
docker compose --profile prod up -d --build
```

L'application est accessible sur **http://localhost:3000**.

> Si le mode dev tourne déjà, arrêtez-le d'abord (même port 3000) :
> ```bash
> docker compose --profile dev down
> docker compose --profile prod up -d --build
> ```

La base de données est stockée dans un volume Docker nommé `db-prod` (persistant entre les redémarrages).

> **Note** : En production, `DATABASE_URL` est automatiquement surchargé vers `file:/app/data/production.db` (volume Docker). La valeur dans `.env` est ignorée pour la base de production.

### Arrêter

```bash
docker compose --profile prod down
```

### Rebuild après modification du code

```bash
docker compose --profile prod up -d --build
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
# Dev (avec suivi en temps réel)
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

```bash
docker compose --profile dev exec dev npx prisma studio
```

Puis exposez le port 5555 si besoin en ajoutant `"5555:5555"` dans les ports du service `dev` dans `docker-compose.yml`.

---

## Architecture des conteneurs

```
Dockerfile (multi-stage)
├── base          — Node 24 slim + outils de compilation (python3, make, g++)
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

### "no space left on device" au build

```bash
# Nettoyer /tmp
sudo rm -rf /tmp/*
# Nettoyer les images/conteneurs Docker inutilisés
docker system prune -a
# Relancer sans --build (l'image est peut-être déjà construite)
docker compose --profile dev up
```

### Le hot reload ne fonctionne pas

Vérifiez que les volumes sont bien montés :

```bash
docker compose --profile dev ps
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
