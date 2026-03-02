---
name: ship:shape
description: "Lance le shaping d'un package en scopes indépendants"
---

# Commande shape

Lance l'agent ship-shaper pour planifier UN package en scopes indépendants avec critères de vérification.

## Instructions

### Résolution du projet (PREMIÈRE ÉTAPE)

1. Lire `cc-ship.json` à la racine du repo
2. Résoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-shaper` en utilisant le tool Task avec les paramètres suivants:

```
subagent_type: ship-shaper
prompt: "Le chemin du projet est {projectPath}. [Le nom du package à shaper ou 'Demande quel package shaper']"
```

## Prérequis

Avant de lancer l'agent, vérifie que ces fichiers existent :

| Fichier | Obligatoire | Créé par |
|---------|-------------|----------|
| `{projectPath}/packages/mapping.md` | Oui | splitter |
| `{projectPath}/prd.md` | Oui | brainstormer-prd |
| `{projectPath}/architecture.md` | Oui | architect |
| `{projectPath}/requirements.md` | Oui | specifier |

Si un fichier manque, indique à l'utilisateur quelle commande lancer :
- Pas de mapping.md → `/ship:split`
- Pas de prd.md → `/ship:prd`
- Pas d'architecture.md → `/ship:architect`
- Pas de requirements.md → `/ship:specify`

## Comportement de relais (IMPORTANT)

Tu es un **relais transparent** entre l'agent et l'utilisateur.

Quand l'agent te retourne une question pour l'utilisateur :
1. **Utilise `AskUserQuestion`** pour la poser exactement comme l'agent l'a formulée
2. Récupère la réponse de l'utilisateur
3. Relance l'agent avec cette réponse

**Ce que tu ne fais JAMAIS** :
- Résumer les questions de l'agent
- Reformuler ce que l'agent demande
- Répondre à la place de l'utilisateur

**Ce que tu fais TOUJOURS** :
- Utiliser AskUserQuestion avec la question exacte de l'agent
- Passer la réponse de l'utilisateur à l'agent
- Continuer jusqu'à ce que l'agent ait terminé

## Comportement attendu

1. **Vérifier les prérequis** : mapping.md, prd.md, architecture.md, requirements.md

2. **Identifier le package** :
   - Si un nom de package est fourni en argument → utiliser ce package
   - Sinon → l'agent demandera lequel shaper

3. **Lancer l'agent ship-shaper** qui va :
   - Lire le mapping et les inputs globaux
   - Extraire les exigences pertinentes
   - Proposer un découpage en scopes (validation utilisateur)
   - Définir les must-haves par scope
   - Définir les critères de vérification
   - Produire package.md et verification.md

## Syntaxe

```
/ship:shape
```

Shape un package (l'agent demandera lequel si plusieurs dans le mapping).

```
/ship:shape auth
```

Shape le package "auth" spécifiquement.

## Output

Le package sera planifié dans `{projectPath}/packages/<nom-package>/` avec :
- `package.md` : Vision, scopes, truths, artifacts, key links
- `verification.md` : Critères de vérification par scope

## Exemples

```
/ship:shape
```

Lance le shaping. Si le mapping contient plusieurs packages, l'agent demande lequel shaper.

```
/ship:shape dashboard
```

Shape directement le package "dashboard".
