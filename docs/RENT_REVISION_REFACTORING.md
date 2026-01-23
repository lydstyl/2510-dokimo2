# Refactoring du système de révision de loyer

## 📋 Résumé des modifications

Ce document résume la refonte complète du système de révision de loyer effectuée le 20 janvier 2026.

## 🎯 Objectifs atteints

### 1. Nouveaux statuts de révision
- ✅ Remplacement des statuts `PENDING/DONE/CANCELLED` par `EN_PREPARATION/COURRIER_AR_ENVOYE/CANCELLED`
- ✅ Meilleure traçabilité du workflow de révision de loyer

### 2. Interface utilisateur améliorée
- ✅ Page `/dashboard/rent-revisions` avec 3 sections :
  - Révisions urgentes (< 2 mois) - badge rouge
  - Révisions en préparation - badge orange
  - Courrier AR envoyé - badge vert
- ✅ Bouton "Nouvelle révision" dans la page rent-revisions
- ✅ Suppression du bouton révision dans `/dashboard/leases`

### 3. Dashboard amélioré
- ✅ Indicateurs de statut sur la carte "Révisions de loyer" :
  - Badge rouge si révisions urgentes (< 2 mois)
  - Badge orange si révisions en préparation
  - Badge vert si courriers envoyés

### 4. Architecture Clean Architecture
- ✅ Tous les changements suivent les principes de Clean Architecture
- ✅ Tests domaine mis à jour (16 tests passent)
- ✅ Use cases mis à jour avec les nouveaux statuts

## 📁 Fichiers modifiés

### Domaine (Domain Layer)
- `src/features/rent-revision/domain/RentRevision.ts`
  - Enum `RentRevisionStatus` : nouveaux statuts
  - Méthode `isInPreparation()` : remplace `isPending()`
  - Méthode `isLetterSent()` : nouvelle
  - Méthode `markAsLetterSent()` : remplace `markAsDone()`

- `src/features/rent-revision/domain/__tests__/RentRevision.test.ts`
  - Tous les tests mis à jour avec nouveaux statuts
  - 16 tests passent ✅

### Application Layer
- `src/features/rent-revision/application/CreateRentRevision.ts`
  - Statut initial : `EN_PREPARATION`

- `src/features/rent-revision/application/MarkRevisionAsLetterSent.ts` (nouveau)
  - Remplace `MarkRevisionAsDone.ts` (supprimé)

- `src/features/rent-revision/application/UpdateRentRevision.ts`
  - Validation : seulement pour révisions `EN_PREPARATION`

- `src/features/rent-revision/application/DeleteRentRevision.ts`
  - Suppression : seulement pour révisions `EN_PREPARATION`

- `src/features/rent-revision/application/GetRevisionStats.ts`
  - Nouveaux compteurs : `urgentCount`, `enPreparationCount`, `courrierEnvoyeCount`, `upcomingCount`

- `src/features/rent-revision/application/__tests__/CreateRentRevision.test.ts`
  - Tests mis à jour

### Infrastructure
- `src/features/rent-revision/infrastructure/PrismaRentRevisionRepository.ts`
  - Méthode `findUrgent()` : recherche statut `EN_PREPARATION`
  - Méthode `toDomain()` : utilise `reconstitute()` pour permettre dates passées

### API Routes
- `src/app/api/rent-revisions/route.ts`
  - GET retourne : `{ urgent, enPreparation, courrierEnvoye, all }`
  - Suppression de la propriété `isPending` dans la sérialisation

- `src/app/api/rent-revisions/[id]/route.ts`
  - PATCH avec `markAsLetterSent` au lieu de `markAsDone`
  - Import de `MarkRevisionAsLetterSent`

### Présentation (React Components)
- `src/app/dashboard/rent-revisions/RentRevisionsClient.tsx`
  - Interface `RevisionsData` : `{ urgent, enPreparation, courrierEnvoye }`
  - Méthode `handleMarkAsSent()` : appelle API avec `markAsLetterSent: true`
  - 3 sections distinctes pour chaque statut
  - Bouton "Nouvelle révision" (lien vers `/dashboard/rent-revisions/new`)
  - Emoji ✉️ pour marquer comme envoyé

- `src/app/dashboard/page.tsx`
  - Badge rouge : `urgentCount` → "X à préparer"
  - Badge orange : `enPreparationCount` → "X en préparation"
  - Badge vert : `courrierEnvoyeCount` → "X envoyés"
  - Fallback avec nouveaux compteurs

- `src/app/dashboard/leases/page.tsx`
  - Suppression de l'import `RentRevisionLetterModal`
  - Suppression des états `isRevisionModalOpen` et `selectedLeaseForRevision`
  - Suppression du bouton "📝 Révision loyer"
  - Suppression du composant modal en fin de page

### Base de données
- `prisma/schema.prisma`
  - Commentaire mis à jour : `"EN_PREPARATION", "COURRIER_AR_ENVOYE", "CANCELLED"`
  - Valeur par défaut : `@default("EN_PREPARATION")`

- `prisma/migrations/20260120204242_update_rent_revision_statuses/migration.sql`
  - Migration générée automatiquement

- `scripts/migrate-rent-revision-statuses.ts` (nouveau)
  - Script de migration des données :
    - `PENDING` → `EN_PREPARATION`
    - `DONE` → `COURRIER_AR_ENVOYE`
  - Exécuté avec succès (0 révisions migrées car DB vide)

### Traductions
- `messages/fr.json`
  - Section `rentRevisions` complètement refaite :
    - `createButton` : "➕ Nouvelle révision"
    - `urgentTitle` : "Révisions urgentes (< 2 mois)"
    - `preparationTitle` : "En préparation"
    - `sentTitle` : "Courrier AR envoyé"
    - `markSent` : "Marquer envoyé"
    - `confirmMarkSent` : confirmation
    - `status.*` : libellés des statuts
    - `modal.*` : toutes les clés pour le futur modal de création
    - `dashboard.badgeUrgent/badgePreparation/badgeSent`

## 🗑️ Fichiers supprimés
- `src/features/rent-revision/application/MarkRevisionAsDone.ts`

## ⚠️ Travail restant (TODO)

### Critique - Modal de création de révision
Le bouton "Nouvelle révision" pointe vers `/dashboard/rent-revisions/new` mais cette page **n'existe pas encore**.

**Options pour compléter** :
1. Créer une page `/dashboard/rent-revisions/new` avec formulaire complet
2. Ou créer un modal `CreateRentRevisionModal.tsx` et modifier le lien en bouton

**Fonctionnalités attendues dans le modal/page** :
- Sélection du bail (dropdown)
- Auto-remplissage loyer et charges actuels
- Formulaire IRL : ancien indice, nouveau indice, trimestre, date effective
- Calcul temps réel du nouveau loyer
- Champ charges modifiable (pour régularisation)
- 3 boutons d'action :
  - "💾 Sauvegarder brouillon" (POST `/api/rent-revisions`)
  - "📄 Sauvegarder + TXT" (POST + génération TXT)
  - "📕 Sauvegarder + PDF" (POST + génération PDF)

### Optionnel - Fonctionnalités avancées
- [ ] Génération de courrier TXT/PDF depuis `/dashboard/rent-revisions`
- [ ] Modification d'une révision en préparation (modal d'édition)
- [ ] Réutiliser le code de `RentRevisionLetterModal.tsx` pour génération courrier
- [ ] Tests d'intégration pour les nouvelles routes API
- [ ] Tests E2E pour le workflow complet

## 🧪 Tests

### Tests passants
- ✅ **Domain layer** : 16 tests passent dans `RentRevision.test.ts`
- ✅ **Application layer** : Test `CreateRentRevision.test.ts` mis à jour et passe
- ✅ **Build** : `npm run build` réussit sans erreur TypeScript
- ✅ **Dev server** : `npm run dev` démarre sans erreur

### Commandes de test
```bash
# Tests domaine
npm test -- src/features/rent-revision/domain/__tests__/RentRevision.test.ts

# Tests application
npm test -- src/features/rent-revision/application/__tests__/CreateRentRevision.test.ts

# Build production
npm run build

# Migration base de données
npx prisma migrate dev --name update_rent_revision_statuses
npx tsx scripts/migrate-rent-revision-statuses.ts
```

## 📊 Impact et bénéfices

### Pour l'utilisateur
- ✨ Meilleure visibilité sur l'état des révisions de loyer
- 🎯 Priorisation claire des révisions urgentes (< 2 mois)
- 📍 Workflow plus proche de la réalité : "en préparation" → "courrier envoyé"
- 🚀 Interface centralisée dans `/dashboard/rent-revisions` au lieu de `/dashboard/leases`

### Pour le code
- 🏗️ Architecture Clean maintenue
- 🧪 Tests domaine et application mis à jour
- 🔄 Migration de données automatisée
- 📝 Documentation complète (ce fichier)
- 🌍 Traductions françaises cohérentes

## 🔄 Workflow de révision de loyer

### Avant (ancien système)
1. Aller dans `/dashboard/leases`
2. Cliquer sur "📝 Révision loyer" (générait juste un courrier)
3. Aucune sauvegarde dans la DB
4. Aucun suivi des révisions

### Après (nouveau système)
1. Aller dans `/dashboard/rent-revisions`
2. Cliquer sur "➕ Nouvelle révision" ⚠️ **Page à créer**
3. Remplir le formulaire (bail, IRL, charges)
4. Sauvegarder → statut `EN_PREPARATION`
5. Optionnel : générer courrier TXT/PDF
6. Marquer "Courrier envoyé" → statut `COURRIER_AR_ENVOYE`
7. Mise à jour manuelle du loyer/charges depuis `/dashboard/leases/[id]/payments`

## 🎨 Interface utilisateur

### Dashboard
```
┌─────────────────────────────────────────┐
│  Révisions de loyer                    │
│  Gérer les révisions annuelles de loyer│
│                                    🔴 3 │ ← Badge rouge si urgentes
│                                    🟠 5 │ ← Badge orange si en préparation
│                                    🟢 2 │ ← Badge vert si courriers envoyés
└─────────────────────────────────────────┘
```

### Page /dashboard/rent-revisions
```
┌────────────────────────────────────────────────────┐
│ Gestion des révisions de loyer                   │
│                         [➕ Nouvelle révision]     │
└────────────────────────────────────────────────────┘

⚠️ Révisions urgentes (< 2 mois) (3)
┌──────────────────────────────────────────────┐
│ Bien | Locataire | Date | Nouveau loyer     │
│ ... tableaux avec fond rouge pâle            │
│ Actions: ✉️ Marquer envoyé | 🗑️ Supprimer   │
└──────────────────────────────────────────────┘

📋 En préparation (5)
┌──────────────────────────────────────────────┐
│ ... tableaux avec fond orange pâle           │
└──────────────────────────────────────────────┘

✅ Courrier AR envoyé (2)
┌──────────────────────────────────────────────┐
│ ... tableaux sans actions                    │
└──────────────────────────────────────────────┘
```

## 🚀 Déploiement

### Étapes pour déployer
1. ✅ Migration Prisma déjà appliquée
2. ✅ Script de migration des données déjà exécuté
3. ✅ Build production réussi
4. ⚠️ Créer la page/modal de création avant mise en production

### Variables d'environnement
Aucune nouvelle variable nécessaire.

## 📞 Support

Pour toute question sur cette refonte :
- Voir les tests : `src/features/rent-revision/**/__tests__/`
- Voir le domaine : `src/features/rent-revision/domain/RentRevision.ts`
- Voir les use cases : `src/features/rent-revision/application/`

---

**Date de refactoring** : 20 janvier 2026
**Statut** : ✅ Fonctionnel (avec création manuelle via API)
**Next steps** : Créer le modal/page de création de révision
