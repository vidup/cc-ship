---
name: ship:amend
description: "Amende le mapping ou les scopes d'un package existant"
---

# Commande amend

Lance l'agent ship-amender pour modifier chirurgicalement le mapping ou les scopes d'un package existant.

## Instructions

### Resolution du projet (PREMIERE ETAPE)

1. Lire `cc-ship.json` a la racine du repo
2. Resoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-amender` en utilisant le tool Task avec les parametres suivants:

```
subagent_type: ship-amender
prompt: "Le chemin du projet est {projectPath}. [L'argument fourni ou 'Demande quoi amender']"
```

## Prerequis

Avant de lancer l'agent, verifie que ces fichiers existent :

| Fichier | Obligatoire | Cree par |
|---------|-------------|----------|
| `{projectPath}/packages/mapping.md` | Oui | splitter |

Si l'argument est un nom de package (pas "mapping"), verifie aussi :

| Fichier | Obligatoire | Cree par |
|---------|-------------|----------|
| `{projectPath}/packages/<nom-package>/package.md` | Oui | shaper |
| `{projectPath}/packages/<nom-package>/verification.md` | Oui | shaper |

Si un fichier manque, indique a l'utilisateur quelle commande lancer :
- Pas de mapping.md → `/ship:split`
- Pas de package.md → `/ship:shape <nom-package>`

## Comportement de relais (IMPORTANT)

Tu es un **relais transparent** entre l'agent et l'utilisateur.

Quand l'agent te retourne une question pour l'utilisateur :
1. **Utilise `AskUserQuestion`** pour la poser exactement comme l'agent l'a formulee
2. Recupere la reponse de l'utilisateur
3. Relance l'agent avec cette reponse

**Ce que tu ne fais JAMAIS** :
- Resumer les questions de l'agent
- Reformuler ce que l'agent demande
- Repondre a la place de l'utilisateur

**Ce que tu fais TOUJOURS** :
- Utiliser AskUserQuestion avec la question exacte de l'agent
- Passer la reponse de l'utilisateur a l'agent
- Continuer jusqu'a ce que l'agent ait termine

## Comportement attendu

1. **Verifier les prerequis** : mapping.md (toujours), + package.md/verification.md si package specifie

2. **Identifier le niveau d'amendement** :
   - Si l'argument est "mapping" → amender le mapping
   - Si l'argument est un nom de package → amender les scopes de ce package
   - Si pas d'argument → l'agent demandera quoi amender

3. **Lancer l'agent ship-amender** qui va :
   - Lire les fichiers existants
   - Comprendre la demande de modification
   - Analyser l'impact (statuts, scopes completes)
   - Proposer les changements (validation utilisateur)
   - Ecrire les fichiers mis a jour

## Syntaxe

```
/ship:amend
```

Amende le mapping ou un package (l'agent demandera quoi amender).

```
/ship:amend mapping
```

Amende le mapping (packages, dependances, ordre).

```
/ship:amend auth
```

Amende les scopes du package "auth".

## Output

Selon le niveau d'amendement :
- **Mapping** : `{projectPath}/packages/mapping.md` mis a jour
- **Scopes** : `{projectPath}/packages/<nom-package>/package.md` et `verification.md` mis a jour

## Exemples

```
/ship:amend
```

Lance l'amendement. L'agent demande quoi amender (mapping ou un package specifique).

```
/ship:amend mapping
```

Amende directement le mapping des packages.

```
/ship:amend dashboard
```

Amende les scopes du package "dashboard".
