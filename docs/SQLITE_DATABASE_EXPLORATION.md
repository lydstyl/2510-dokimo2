# Guide d'Exploration des Bases de Données SQLite

Ce guide explique comment explorer et analyser des bases de données SQLite, notamment les fichiers de sauvegarde (`prisma/dev.db.backup.*`).

## Table des Matières

1. [Outils Disponibles](#outils-disponibles)
2. [Ligne de Commande (sqlite3)](#ligne-de-commande-sqlite3)
3. [Interface Graphique (Prisma Studio)](#interface-graphique-prisma-studio)
4. [Outils Tiers](#outils-tiers)
5. [Exemples de Requêtes Utiles](#exemples-de-requêtes-utiles)
6. [Restauration d'une Sauvegarde](#restauration-dune-sauvegarde)

---

## Outils Disponibles

### 1. SQLite CLI (`sqlite3`)
✅ **Recommandé pour** : Requêtes rapides, scripts, inspection de schéma

**Installation** :
```bash
# Ubuntu/Debian
sudo apt-get install sqlite3

# macOS
brew install sqlite3

# Windows (via chocolatey)
choco install sqlite
```

### 2. Prisma Studio
✅ **Recommandé pour** : Navigation visuelle, édition de données

### 3. Outils GUI Tiers
- **DB Browser for SQLite** (gratuit, multiplateforme)
- **TablePlus** (payant, macOS/Windows)
- **DBeaver** (gratuit, multiplateforme)

---

## Ligne de Commande (sqlite3)

### Ouvrir une Base de Données

```bash
# Base de données principale
sqlite3 prisma/dev.db

# Base de données de sauvegarde
sqlite3 prisma/dev.db.backup.20251108_151403
```

### Commandes Essentielles

Une fois dans le shell SQLite (`sqlite>`), utilisez ces commandes :

#### Afficher les Tables

```sql
.tables
```
**Output** :
```
Boiler                 LeaseTenant            Property
BoilerMaintenance      Payment                PropertyChargeShare
Building               PropertyDiagnostic     PropertyListing
FinancialDocument      RentRevision           Tenant
InsuranceCertificate   User                   WaterMeterReading
Inventory              Landlord               _prisma_migrations
```

#### Afficher le Schéma d'une Table

```sql
.schema Landlord
```
**Output** :
```sql
CREATE TABLE "Landlord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "siret" TEXT,
    "managerName" TEXT,
    "managerEmail" TEXT,
    "managerPhone" TEXT,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Landlord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

#### Mode d'Affichage

```sql
-- Mode colonne (lisible)
.mode column

-- Mode tableau
.mode table

-- Mode ligne
.mode line

-- Avec headers
.headers on
```

#### Exécuter des Requêtes

```sql
-- Compter les utilisateurs
SELECT COUNT(*) FROM User;

-- Lister tous les bailleurs
SELECT id, name, type, email FROM Landlord;

-- Lister les biens avec leur bailleur
SELECT
  p.name AS property,
  l.name AS landlord,
  p.type,
  p.city
FROM Property p
JOIN Landlord l ON p.landlordId = l.id;
```

#### Sauvegarder le Résultat d'une Requête

```sql
.output result.txt
SELECT * FROM Landlord;
.output stdout  -- Revenir à l'affichage standard
```

#### Quitter SQLite

```sql
.quit
-- ou
.exit
```

---

## Interface Graphique (Prisma Studio)

Prisma Studio fournit une interface graphique pour explorer votre base de données.

### Ouvrir Prisma Studio

```bash
# Pour la base principale
npm run prisma:studio

# Pour une sauvegarde, restaurez-la d'abord
npm run db:restore prisma/dev.db.backup.20251108_151403
npm run prisma:studio
```

Prisma Studio s'ouvrira dans votre navigateur à `http://localhost:5555`

**Fonctionnalités** :
- ✅ Navigation visuelle entre les tables
- ✅ Édition de données en temps réel
- ✅ Filtrage et recherche
- ✅ Visualisation des relations
- ⚠️ Nécessite que la base soit la base active (`dev.db`)

---

## Outils Tiers

### DB Browser for SQLite (Recommandé)

**Installation** :
```bash
# Ubuntu/Debian
sudo apt-get install sqlitebrowser

# macOS
brew install --cask db-browser-for-sqlite

# Windows : télécharger depuis https://sqlitebrowser.org/
```

**Utilisation** :
1. Lancez DB Browser
2. Ouvrez le fichier : `File > Open Database`
3. Sélectionnez `prisma/dev.db.backup.20251108_151403`

**Fonctionnalités** :
- ✅ Visualisation du schéma
- ✅ Édition de données
- ✅ Exécution de requêtes SQL
- ✅ Import/Export de données
- ✅ Comparaison de bases de données

---

## Exemples de Requêtes Utiles

### 1. Statistiques Globales

```sql
-- Nombre d'enregistrements par table
SELECT
  'Users' AS table_name, COUNT(*) AS count FROM User
UNION ALL SELECT 'Landlords', COUNT(*) FROM Landlord
UNION ALL SELECT 'Properties', COUNT(*) FROM Property
UNION ALL SELECT 'Tenants', COUNT(*) FROM Tenant
UNION ALL SELECT 'Leases', COUNT(*) FROM Lease
UNION ALL SELECT 'Payments', COUNT(*) FROM Payment;
```

### 2. Trouver Toutes les Données d'un Utilisateur

```sql
-- Remplacer 'user-1' par l'ID de l'utilisateur
SELECT 'User' AS type, id, email AS info FROM User WHERE id = 'user-1'
UNION ALL
SELECT 'Landlord', id, name FROM Landlord WHERE userId = 'user-1'
UNION ALL
SELECT 'Property', p.id, p.name
FROM Property p
JOIN Landlord l ON p.landlordId = l.id
WHERE l.userId = 'user-1';
```

### 3. Analyser les Paiements

```sql
-- Total des paiements par bail
SELECT
  l.id AS lease_id,
  p.name AS property,
  t.firstName || ' ' || t.lastName AS tenant,
  COUNT(pay.id) AS payment_count,
  SUM(pay.amount) AS total_paid
FROM Lease l
JOIN Property p ON l.propertyId = p.id
JOIN LeaseTenant lt ON l.id = lt.leaseId
JOIN Tenant t ON lt.tenantId = t.id
LEFT JOIN Payment pay ON l.id = pay.leaseId
GROUP BY l.id;
```

### 4. Baux Actifs

```sql
SELECT
  l.id,
  p.name AS property,
  l.rentAmount,
  l.chargesAmount,
  l.startDate,
  l.endDate
FROM Lease l
JOIN Property p ON l.propertyId = p.id
WHERE l.endDate IS NULL OR l.endDate > DATE('now');
```

### 5. Chercher du Texte dans les Notes

```sql
-- Chercher dans toutes les notes (nouvellement ajoutées)
SELECT 'Landlord' AS type, id, name, note FROM Landlord WHERE note LIKE '%important%'
UNION ALL
SELECT 'Property', id, name, note FROM Property WHERE note LIKE '%important%'
UNION ALL
SELECT 'Tenant', id, firstName || ' ' || lastName, note FROM Tenant WHERE note LIKE '%important%'
UNION ALL
SELECT 'Lease', id, 'Lease ' || id, note FROM Lease WHERE note LIKE '%important%';
```

### 6. Vérifier l'Intégrité des Données

```sql
-- Bailleurs sans utilisateur (erreur de clé étrangère)
SELECT l.* FROM Landlord l
LEFT JOIN User u ON l.userId = u.id
WHERE u.id IS NULL;

-- Biens sans bailleur
SELECT p.* FROM Property p
LEFT JOIN Landlord l ON p.landlordId = l.id
WHERE l.id IS NULL;
```

---

## Restauration d'une Sauvegarde

### Option 1 : Utiliser le Script Automatique

```bash
# Lister les sauvegardes disponibles
ls -lh prisma/dev.db.backup.*

# Restaurer une sauvegarde spécifique
npm run db:restore prisma/dev.db.backup.20251108_151403
```

Le script :
1. ✅ Sauvegarde automatiquement la base actuelle avant restauration
2. ✅ Restaure la sauvegarde choisie
3. ✅ Affiche un résumé des données restaurées

### Option 2 : Restauration Manuelle

```bash
# Sauvegarder la base actuelle
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)

# Restaurer la sauvegarde
cp prisma/dev.db.backup.20251108_151403 prisma/dev.db

# Redémarrer le serveur
npm run dev
```

### Option 3 : Fusionner des Données

Si vous voulez récupérer uniquement certaines données :

```bash
# 1. Ouvrir la sauvegarde
sqlite3 prisma/dev.db.backup.20251108_151403

# 2. Attacher la base actuelle
sqlite> ATTACH 'prisma/dev.db' AS current;

# 3. Copier des données spécifiques
sqlite> INSERT INTO current.Landlord
        SELECT * FROM main.Landlord WHERE id = 'landlord-specific-id';

# 4. Détacher et quitter
sqlite> DETACH current;
sqlite> .quit
```

---

## Export de Données

### Export en CSV

```bash
# Ligne de commande
sqlite3 prisma/dev.db.backup.20251108_151403 <<EOF
.headers on
.mode csv
.output landlords.csv
SELECT * FROM Landlord;
.quit
EOF
```

### Export en SQL

```bash
# Dump complet
sqlite3 prisma/dev.db.backup.20251108_151403 .dump > backup.sql

# Dump d'une table spécifique
sqlite3 prisma/dev.db.backup.20251108_151403 .dump Landlord > landlords.sql
```

### Export en JSON (via script)

```bash
# Installer jq si nécessaire
sudo apt-get install jq

# Export en JSON
sqlite3 -json prisma/dev.db.backup.20251108_151403 "SELECT * FROM Landlord;" | jq '.' > landlords.json
```

---

## Analyse Avancée

### Taille de la Base de Données

```bash
# Taille du fichier
ls -lh prisma/dev.db.backup.20251108_151403

# Analyse de l'espace utilisé par table
sqlite3 prisma/dev.db.backup.20251108_151403 <<EOF
SELECT
  name,
  SUM(pgsize) as size_bytes,
  ROUND(SUM(pgsize) / 1024.0, 2) as size_kb
FROM dbstat
GROUP BY name
ORDER BY size_bytes DESC;
EOF
```

### Historique des Migrations

```sql
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;
```

---

## Scripts Utiles

### Script Bash pour Comparer Deux Bases

```bash
#!/bin/bash
# compare-db.sh

DB1="prisma/dev.db"
DB2="prisma/dev.db.backup.20251108_151403"

echo "Comparing $DB1 and $DB2"
echo "========================"

for table in $(sqlite3 $DB1 "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';"); do
  count1=$(sqlite3 $DB1 "SELECT COUNT(*) FROM $table;")
  count2=$(sqlite3 $DB2 "SELECT COUNT(*) FROM $table;")

  if [ "$count1" != "$count2" ]; then
    echo "❌ $table: $count1 vs $count2"
  else
    echo "✅ $table: $count1 rows"
  fi
done
```

---

## Résolution de Problèmes

### Base de Données Verrouillée

```bash
# Vérifier les processus utilisant la base
lsof prisma/dev.db

# Forcer la fermeture
pkill -f "prisma studio"
pkill -f "next dev"
```

### Base de Données Corrompue

```bash
# Vérifier l'intégrité
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Réparer (créer une copie propre)
sqlite3 prisma/dev.db ".dump" | sqlite3 prisma/dev.db.repaired
```

---

## Ressources Supplémentaires

- [SQLite Documentation Officielle](https://www.sqlite.org/docs.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)

---

## Commandes Rapides (Aide-Mémoire)

```bash
# Explorer une sauvegarde
sqlite3 prisma/dev.db.backup.20251108_151403

# Dans SQLite
.tables                    # Lister les tables
.schema TableName          # Voir le schéma
.mode column               # Mode lisible
.headers on                # Afficher les en-têtes
SELECT * FROM User;        # Requête
.quit                      # Quitter

# Restaurer une sauvegarde
npm run db:restore prisma/dev.db.backup.20251108_151403

# Ouvrir Prisma Studio
npm run prisma:studio
```
