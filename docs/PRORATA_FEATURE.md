# Fonctionnalité : Calculateur de Prorata Temporis

## Vue d'ensemble

Le calculateur de prorata temporis permet de calculer le montant du loyer au prorata pour les entrées et sorties de locataires en milieu de mois.

## Accès

- **URL** : `/fr/prorata`
- **Depuis le tableau de bord** : Carte "Calcul Prorata" dans la grille principale

## Fonctionnalités

### Types de calcul

1. **Entrée de locataire (MOVE_IN)**
   - Calcule le montant dû pour la période restante du mois
   - Exemple : Un locataire entre le 15 janvier, il paie du 15 au 31 janvier

2. **Sortie de locataire (MOVE_OUT)**
   - Calcule le montant dû pour la période occupée du mois
   - Exemple : Un locataire sort le 10 février, il paie du 1er au 10 février

### Informations calculées

- **Loyer mensuel** : Le loyer complet du mois
- **Tarif journalier** : Loyer mensuel ÷ nombre de jours dans le mois
- **Jours occupés** : Nombre de jours à payer (inclusif)
- **Pourcentage** : Pourcentage du mois occupé
- **Montant au prorata** : Le montant final à payer

### Exemple de calcul

**Scénario** : Locataire entre le 15 janvier 2025, loyer mensuel 1000€

- Jours dans le mois : 31
- Jours occupés : 17 (du 15 au 31 inclus)
- Tarif journalier : 1000€ ÷ 31 = 32.26€
- Montant au prorata : 32.26€ × 17 = 548.39€
- Pourcentage : 54.84%

## Architecture Technique

Cette fonctionnalité suit **Clean Architecture** avec une structure feature-based :

```
src/features/prorata/
├── domain/                                    # Logique métier pure
│   ├── __tests__/
│   │   └── ProrataCalculation.test.ts        # Tests du domaine (12 tests)
│   └── ProrataCalculation.ts                 # Entité de domaine
├── application/                               # Cas d'utilisation
│   ├── __tests__/
│   │   └── CalculateProrata.test.ts          # Tests du use case (8 tests)
│   └── CalculateProrata.ts                   # Use case
└── presentation/                              # Interface utilisateur
    └── components/
        └── ProrataCalculator.tsx             # Composant React
```

### Couche Domaine

**Fichier** : [ProrataCalculation.ts](../src/features/prorata/domain/ProrataCalculation.ts)

L'entité `ProrataCalculation` encapsule toute la logique de calcul :

- Validation des dates (même mois, date début ≤ date fin)
- Calcul du nombre de jours occupés (inclusif des deux dates)
- Calcul du montant au prorata
- Calcul du pourcentage
- Calcul du tarif journalier

**Règles métier** :
- Les dates doivent être dans le même mois
- Le nombre de jours dans le mois doit être entre 28 et 31
- Les montants sont arrondis à 2 décimales
- Le calcul inclut à la fois la date de début ET la date de fin

### Couche Application

**Fichier** : [CalculateProrata.ts](../src/features/prorata/application/CalculateProrata.ts)

Le use case `CalculateProrata` :
- Convertit les entrées (nombres, strings) en objets domaine (Money, Date)
- Détermine automatiquement le nombre de jours dans le mois
- Valide que les dates sont dans le même mois
- Retourne un résultat sérialisé pour la présentation

### Couche Présentation

**Fichier** : [ProrataCalculator.tsx](../src/features/prorata/presentation/components/ProrataCalculator.tsx)

Composant client React avec :
- Sélection du type de calcul (entrée/sortie)
- Formulaire avec validation
- Affichage détaillé des résultats
- Breakdown du calcul pour transparence
- Texte d'aide contextuel selon le type

## Tests

**Tous les tests passent** : ✅ 20 tests au total

### Tests de domaine (12 tests)

```bash
npm test -- ProrataCalculation.test.ts
```

Couvre :
- Création de l'entité avec validation
- Calcul du montant au prorata
- Calcul du pourcentage
- Calcul du tarif journalier
- Cas limites (mois complet, un seul jour, etc.)

### Tests d'application (8 tests)

```bash
npm test -- CalculateProrata.test.ts
```

Couvre :
- Calculs pour entrée et sortie
- Mois complets
- Années bissextiles
- Validation des erreurs

## Traductions

Toutes les traductions sont dans [messages/fr.json](../messages/fr.json) sous la clé `prorata` :

- Titres et descriptions
- Labels de formulaire
- Messages d'aide
- Messages d'erreur
- Labels de résultats

## Validation

### Validations frontend
- Montant > 0
- Dates requises

### Validations domaine
- Montant ne peut pas être négatif (via `Money`)
- Date de début ≤ date de fin
- Dates dans le même mois
- Jours du mois entre 28 et 31

## Points techniques importants

### Gestion des dates
Utilise `Date.UTC()` pour éviter les problèmes de fuseau horaire lors du calcul des différences de jours.

### Précision des calculs
Tous les montants monétaires utilisent le value object `Money` et sont arrondis à 2 décimales pour éviter les erreurs d'arrondi.

### Immutabilité
L'entité `ProrataCalculation` est immutable, suivant les principes du domaine.

## Améliorations futures possibles

- Export PDF du résultat de calcul
- Historique des calculs effectués
- Ajout automatique aux baux lors de la création
- Support des charges en plus du loyer
- Calcul sur plusieurs mois (pour des cas particuliers)

## Conformité

Cette fonctionnalité suit toutes les conventions du projet :

- ✅ Code en anglais, UI en français
- ✅ Clean Architecture avec feature-based structure
- ✅ TDD (tests écrits avant implémentation)
- ✅ Tests obligatoires pour domaine et application
- ✅ Aucune dépendance externe dans le domaine
- ✅ Utilisation de value objects (Money)
- ✅ Entités immutables
- ✅ Traductions via next-intl

## Maintenance

Pour modifier la logique de calcul :

1. **Modifier les tests** dans `domain/__tests__/ProrataCalculation.test.ts`
2. **Implémenter les changements** dans `domain/ProrataCalculation.ts`
3. **Vérifier** que tous les tests passent
4. **Mettre à jour** les traductions si nécessaire

---

**Date de création** : 2025-01-08
**Dernière mise à jour** : 2025-01-08
**Version** : 1.0.0
