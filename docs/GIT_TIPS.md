# Trucs et Astuces Git

Guide pratique pour résoudre les problèmes Git courants.

## Problème : Ignorer un fichier déjà suivi par Git

### Situation
Vous avez un fichier qui est déjà dans Git (par exemple `prisma/dev copy.db`) et vous voulez que Git l'ignore maintenant, mais **sans le supprimer de votre disque**.

### Solution : `git rm --cached`

```bash
# Retirer le fichier du suivi Git, mais le garder sur le disque
git rm --cached "nom-du-fichier"

# Exemple avec un fichier contenant des espaces
git rm --cached "prisma/dev copy.db"
```

### Explication de `git rm --cached`

**`git rm --cached`** = "Arrête de suivre ce fichier dans Git, mais ne le supprime PAS de mon ordinateur"

| Commande | Effet sur Git | Effet sur le disque |
|----------|---------------|---------------------|
| `git rm fichier` | ✅ Supprime du suivi | ❌ **Supprime le fichier** |
| `git rm --cached fichier` | ✅ Supprime du suivi | ✅ **Garde le fichier** |

**Quand l'utiliser ?**
- Vous avez ajouté un fichier par erreur dans Git (base de données, fichiers de config avec mots de passe, etc.)
- Vous venez d'ajouter une règle dans `.gitignore` mais le fichier est déjà suivi
- Vous voulez garder le fichier localement mais ne plus le versionner

**Workflow complet** :
```bash
# 1. Ajouter la règle dans .gitignore
echo "prisma/dev.db" >> .gitignore

# 2. Retirer le fichier du suivi Git
git rm --cached prisma/dev.db

# 3. Commiter le changement
git add .gitignore
git commit -m "fix: ignore database file"

# Le fichier reste sur votre disque, mais Git ne le suit plus
```

## Problème : Espaces dans les noms de fichiers

### Dans `.gitignore`

Les espaces doivent être **échappés avec un backslash** `\` :

```gitignore
# ❌ INCORRECT - ne fonctionne pas
prisma/dev copy.db

# ✅ CORRECT - échappe l'espace avec \
prisma/dev\ copy.db
```

### Dans les commandes Git

Utilisez des **guillemets** autour du nom de fichier :

```bash
# ✅ CORRECT
git rm --cached "prisma/dev copy.db"
git add "mon fichier avec espaces.txt"

# ❌ INCORRECT - Git va chercher deux fichiers séparés
git add mon fichier avec espaces.txt
```

## Autres astuces courantes

### Voir quels fichiers sont ignorés

```bash
# Liste tous les fichiers ignorés
git status --ignored

# Vérifier si un fichier spécifique est ignoré
git check-ignore -v nom-du-fichier
```

### Ignorer tous les fichiers d'un type

```bash
# Dans .gitignore :
*.db          # Tous les fichiers .db
*.log         # Tous les fichiers .log
.env*         # Tous les fichiers commençant par .env
```

### Ignorer un dossier entier

```bash
# Dans .gitignore :
node_modules/     # Ignore le dossier et tout son contenu
logs/             # Ignore le dossier logs
```

### Forcer l'ajout d'un fichier ignoré

Si vous voulez vraiment ajouter un fichier qui est dans `.gitignore` :

```bash
git add -f fichier-ignore.txt
```

### Annuler les modifications d'un fichier

```bash
# Annuler les modifications d'un fichier (revenir à la dernière version commitée)
git checkout -- nom-du-fichier

# Ou avec la nouvelle syntaxe
git restore nom-du-fichier
```

### Voir l'historique d'un fichier spécifique

```bash
# Voir tous les commits qui ont modifié ce fichier
git log -- nom-du-fichier

# Voir les changements ligne par ligne
git log -p -- nom-du-fichier
```

## Résumé rapide

| Problème | Solution |
|----------|----------|
| Ignorer un fichier déjà suivi | `git rm --cached fichier` + ajouter à `.gitignore` |
| Espace dans nom de fichier | Échapper avec `\` dans `.gitignore`, utiliser `"..."` dans les commandes |
| Voir les fichiers ignorés | `git status --ignored` |
| Annuler des modifications | `git restore nom-du-fichier` |
| Forcer l'ajout d'un fichier ignoré | `git add -f fichier` |

---

**💡 Astuce** : Pour éviter les problèmes, évitez les espaces dans les noms de fichiers. Utilisez plutôt des tirets ou underscores : `dev_copy.db` ou `dev-copy.db`
