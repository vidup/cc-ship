---
name: ship:execute
description: "Lance l'execution d'un scope de package"
---

# Commande execute

Lance l'agent ship-executor pour implementer UN scope d'un package en respectant strictement les contraintes definies.

## Instructions

### Resolution du projet (PREMIERE ETAPE)

1. Lire `cc-ship.json` a la racine du repo
2. Resoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-executor` en utilisant le tool Task avec les parametres suivants:

```
subagent_type: ship-executor
prompt: "Le chemin du projet est {projectPath}. [Le package et/ou scope a executer]"
```

## Prerequis

Avant de lancer l'agent, verifie que ces fichiers existent :

| Fichier | Obligatoire | Cree par |
|---------|-------------|----------|
| `{projectPath}/packages/<nom>/package.md` | Oui | shaper |
| `{projectPath}/packages/<nom>/verification.md` | Oui | shaper |
| `{projectPath}/architecture.md` | Oui | architect |
| `{projectPath}/requirements.md` | Oui | specifier |

### Verification du status

Le package.md doit avoir un status valide :
- `shaped` : OK, l'executor peut commencer
- `executing` : OK, reprise d'une execution en cours
- Autres (`pending`, `shaping`, etc.) : Refuse et suggere l'etape manquante

Si le status n'est pas valide :
- `pending` ou `shaping` -> `/ship:shape`
- Pas de package.md -> `/ship:shape`

## Detection du package actif

Si aucun package n'est specifie :
1. Chercher les packages avec status `shaped` ou `executing`
2. Si un seul : l'utiliser
3. Si plusieurs : demander a l'utilisateur
4. Si aucun : suggerer `/ship:shape`

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

1. **Verifier les prerequis** : package.md, verification.md, architecture.md, requirements.md

2. **Identifier le package et scope** :
   - Si un package est fourni en argument -> utiliser ce package
   - Si un scope est fourni -> utiliser ce scope specifique
   - Sinon -> utiliser le current_scope du package.md

3. **Lancer l'agent ship-executor** qui va :
   - Lire le package.md et extraire le scope
   - Verifier les prerequis (scopes precedents completes)
   - Creer une checklist de scope
   - Implementer les Truths, Artifacts, Key Links
   - Auto-verifier chaque element
   - Mettre a jour le front-matter (status: executed)

## Syntaxe

```
/ship:execute
```

Execute le scope courant du package actif (detecte automatiquement).

```
/ship:execute auth
```

Execute le scope courant du package "auth".

```
/ship:execute auth
```

Raccourci : execute le scope courant du package "auth".

```
/ship:execute auth scope-2
```

Raccourci : execute le scope-2 du package "auth".

## Output

Le scope sera implemente et le package.md mis a jour :
- `status: executing` -> `status: executed`
- Scope ajoute a `scopes_completed`
- `current_scope` passe au scope suivant

## Exemples

```
/ship:execute
```

Detecte automatiquement le package avec status `shaped` et execute son premier scope.

```
/ship:execute auth
```

Execute le scope courant du package "auth".

```
/ship:execute auth scope-2
```

Execute specifiquement le scope-2 du package "auth", meme si ce n'est pas le current_scope (apres verification des prerequis).

## Gestion des erreurs

### Scope creep detecte

Si l'utilisateur demande quelque chose hors scope pendant l'execution, l'agent :
1. Rappelle poliment que c'est hors scope
2. Cite la section "Not included" du package.md
3. Propose des options (continuer, ajouter scope, nouveau package)

### Prerequis manquant

Si un scope precedent n'est pas complete :
```
Le scope-2 ne peut pas etre execute car scope-1 n'est pas complete.
Voulez-vous executer scope-1 d'abord ?
```

### Status invalide

Si le status du package n'est pas `shaped` ou `executing` :
```
Ce package a le status "pending". Il doit d'abord etre shape.
Lancez /ship:shape pour planifier ce package.
```
