---
name: ship:init
description: "Initialise un nouveau projet ship"
---

# Commande init

Initialise un nouveau projet ship avec son dossier dédié.

## Syntaxe

```
/ship:init [nom-projet]
```

## Instructions

### Étape 1 : Résoudre la configuration

1. Lire `cc-ship.json` à la racine du repo
2. **Si `cc-ship.json` n'existe pas** :
   - Demander `projectsDir` via `AskUserQuestion` (proposer `.ship` par défaut)
   - Créer `cc-ship.json` avec le `projectsDir` choisi et `currentProject: null`

3. **Si `cc-ship.json` existe** :
   - Lire `projectsDir` depuis le fichier

### Étape 2 : Résoudre le nom du projet

1. **Si un nom est fourni en argument** (ex: `/ship:init mon-jeu`) → utiliser ce nom
2. **Si pas de nom** → demander le nom du projet via `AskUserQuestion`

Le nom du projet doit être un slug valide (lettres minuscules, chiffres, tirets). Si l'utilisateur donne un nom invalide, le slugifier automatiquement et confirmer.

### Étape 3 : Créer le projet

1. Créer le dossier `{projectsDir}/{nom-projet}/`
2. Mettre à jour `cc-ship.json` avec `currentProject: "{nom-projet}"`
3. Confirmer :

```
Projet "{nom-projet}" initialisé dans {projectsDir}/{nom-projet}/.
Lance /ship:brainstorm pour commencer, ou /ship:next pour le workflow guidé.
```

## Gestion des erreurs

### Projet déjà existant

Si le dossier `{projectsDir}/{nom-projet}/` existe déjà :

```
Le projet "{nom-projet}" existe déjà dans {projectsDir}/{nom-projet}/.
```

Options via `AskUserQuestion` :
1. **Reprendre ce projet** - Setter `currentProject` et continuer
2. **Choisir un autre nom** - Demander un nouveau nom
3. **Annuler** - Ne rien faire

## Exemples

```
/ship:init mon-jeu
```

Crée `.ship/mon-jeu/` et configure `cc-ship.json`.

```
/ship:init
```

Demande le nom du projet puis le crée.
