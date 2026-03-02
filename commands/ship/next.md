---
name: ship:next
description: "Orchestre le workflow complet ou reprend là où on en était"
---

# Commande next

Orchestre le workflow ship complet avec validation humaine entre chaque étape.

## Instructions

### Étape 0 : Résolution du projet (PREMIÈRE ÉTAPE)

1. Lire `cc-ship.json` à la racine du repo
   - **Si n'existe pas** → demander `projectsDir` via `AskUserQuestion` (proposer `.ship` par défaut) → créer `cc-ship.json`

2. Résoudre le projet :
   - **Si argument fourni** (ex: `/ship:next mon-jeu`) → setter `currentProject` dans `cc-ship.json`, continuer
   - **Si pas d'argument ET `currentProject` existe** → l'utiliser SILENCIEUSEMENT (pas de confirmation)
   - **Si pas d'argument ET `currentProject` est null** → scanner `projectsDir`, lister les projets disponibles, demander lequel via `AskUserQuestion`. Si aucun projet → proposer `/ship:init`

3. Le chemin projet résolu = `{projectsDir}/{currentProject}/`
   **Utiliser CE chemin partout à la place de `.ship/`**

### Étape 1 : Détecter l'état actuel

Utilise le même algorithme que `/ship:status` pour détecter l'état du projet.

#### Fichiers à vérifier (dans l'ordre)

1. `{projectPath}/` - Dossier projet
2. `{projectPath}/brief.md` - Brief (output brainstorm)
3. `{projectPath}/prd.md` - PRD (output prd)
4. `{projectPath}/requirements.md` - Spécifications (output specify)
5. `{projectPath}/architecture.md` - Architecture (output architect)
6. `{projectPath}/packages/mapping.md` - Mapping (output split)

Où `{projectPath}` = `{projectsDir}/{currentProject}`

#### Pour les packages

Si `mapping.md` existe, lire le front-matter de chaque `package.md`:

```yaml
---
status: pending | shaping | shaped | executing | executed | verifying | done
current_scope: <nom-du-scope>
---
```

### Étape 2 : Déterminer la prochaine étape

```
function getNextStep(state):
    if not exists({projectPath}/brief.md):
        return 'brainstorm'
    if not exists({projectPath}/prd.md):
        return 'prd'
    if not exists({projectPath}/requirements.md):
        return 'specify'
    if not exists({projectPath}/architecture.md):
        return 'architect'
    if not exists({projectPath}/packages/mapping.md):
        return 'split'

    # Phase packages : boucle shape → execute → verify
    for package in getPackages():
        if package.status == 'pending':
            return 'shape:' + package.name
        if package.status == 'shaped':
            return 'execute:' + package.name
        if package.status == 'executed':
            return 'verify:' + package.name

    return 'complete'
```

### Étape 3 : Proposer à l'utilisateur

#### Au démarrage

Utilise `AskUserQuestion` pour présenter l'état et demander confirmation:

```
Je détecte l'état suivant:
- [liste des fichiers existants]
- [packages et leurs status si applicable]

Prochaine étape recommandée: [étape]
```

Options:
1. **Continuer** - Exécuter l'étape recommandée
2. **Skip** - Passer cette étape (si fichier déjà existant)
3. **Choisir une autre étape** - L'utilisateur choisit
4. **Arrêter** - Terminer la session

#### Après chaque étape

```
[Étape X] terminée.

Résumé:
- [outputs produits]
- [décisions prises]

Prochaine étape: [Y]
```

Reposer la question de continuation.

### Étape 4 : Exécuter l'étape

Lance l'agent approprié via le tool `Task`.

**IMPORTANT** : Quand tu lances un agent, fournis-lui le chemin du projet résolu dans le prompt. Exemple :
```
"Le chemin du projet est {projectPath}. Transforme le brief en PRD."
```

| Étape | Agent | Output |
|-------|-------|--------|
| brainstorm | ship-brainstormer | brief.md |
| prd | ship-brainstormer-prd | prd.md |
| specify | ship-specifier | requirements.md |
| architect | ship-architect | architecture.md |
| split | ship-splitter | mapping.md |
| shape | ship-shaper | package.md |
| execute | ship-executor | code |
| verify | ship-verifier | verification.md |

## ⚠️ Comportement de relais (IMPORTANT)

Tu es un **relais transparent** entre les agents et l'utilisateur.

Quand un agent te retourne une question pour l'utilisateur:
1. **Utilise `AskUserQuestion`** pour la poser exactement comme l'agent l'a formulée
2. Récupère la réponse de l'utilisateur
3. Relance l'agent avec cette réponse

**Ce que tu ne fais JAMAIS**:
- Résumer les questions de l'agent
- Reformuler ce que l'agent demande
- Répondre à la place de l'utilisateur

**Ce que tu fais TOUJOURS**:
- Utiliser AskUserQuestion avec la question exacte de l'agent
- Passer la réponse de l'utilisateur à l'agent
- Continuer jusqu'à ce que l'agent ait terminé

## Gestion du skip

### Étapes skippables

| Étape | Skippable | Condition |
|-------|-----------|-----------|
| brainstorm | oui | brief.md existe |
| prd | oui | prd.md existe |
| specify | oui | requirements.md existe |
| architect | oui | architecture.md existe ou dev le fournit |
| split | oui | mapping.md existe |
| shape | oui | package.md existe |
| execute | non | - |
| verify | non | - |

### Validation minimale si skip

Si l'utilisateur skip et que le fichier existe, vérifie le format minimal:

| Fichier | Validation minimale |
|---------|---------------------|
| brief.md | Sections "L'idée en une phrase", "Contexte", "Objectifs" |
| prd.md | Au moins une fonctionnalité décrite |
| requirements.md | Au moins un REQ-* identifié |
| architecture.md | Sections "Vue d'ensemble", "Composants" |
| mapping.md | Au moins un package défini |
| package.md | Front-matter avec status, Section "Scopes" |

## Gestion des packages multiples

Quand plusieurs packages existent dans mapping.md:

1. Présenter la liste avec leur status
2. Demander à l'utilisateur lequel traiter
3. Traiter un seul package à la fois (pas de parallélisme)
4. L'ordre suggéré par mapping.md est indicatif, l'utilisateur décide

```
Packages détectés:
1. auth (status: pending)
2. dashboard (status: pending)
3. notifications (status: pending)

Lequel voulez-vous traiter en premier?
```

## Gestion des erreurs et reprises

### Si un agent échoue en cours d'étape

- Le front-matter garde le status "in_progress" (shaping, executing, verifying)
- Au relancement, next détecte cet état et propose de reprendre ou recommencer

### Reprise après interruption

Les fichiers du projet persistent. Au relancement:
1. Détecter l'état via les fichiers et front-matter
2. Proposer de reprendre depuis l'étape en cours
3. L'utilisateur peut choisir de recommencer une étape

## Fin de flow

Quand tous les packages ont status `done`:

```
Tous les packages sont terminés!

Résumé du projet:
- [X] packages implémentés
- [Y] scopes vérifiés

Le projet ship est complet. Bravo!
```

## Exemple de session

```
Utilisateur: /ship:next

Next: "Je détecte:
- Projet actif: mon-jeu (.ship/mon-jeu/)
- brief.md existe (brainstorm fait)
- prd.md existe (prd fait)
- requirements.md n'existe pas

Prochaine étape: specify (créer requirements.md)
Continuer?"

Utilisateur: "Oui"

Next: [Lance ship-specifier via Task avec le chemin du projet]
...
"Specify terminé. requirements.md créé.

Prochaine étape: architect
Continuer?"

Utilisateur: "Skip, j'ai déjà l'archi"

Next: "OK, je vérifie architecture.md...
Format valide.

Prochaine étape: split
Continuer?"
```
