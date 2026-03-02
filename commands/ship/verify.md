---
name: ship:verify
description: "Lance la verification d'un package implemente"
---

# Commande verify

Lance l'agent ship-verifier pour verifier l'implementation d'un scope contre ses criteres de verification.

## Instructions

### Resolution du projet (PREMIERE ETAPE)

1. Lire `cc-ship.json` a la racine du repo
2. Resoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-verifier` en utilisant le tool Task avec les parametres suivants:

```
subagent_type: ship-verifier
prompt: "Le chemin du projet est {projectPath}. [Le package et/ou scope a verifier]"
```

## Prerequis

Avant de lancer l'agent, verifie que ces fichiers existent :

| Fichier | Obligatoire | Cree par |
|---------|-------------|----------|
| `{projectPath}/packages/<nom>/package.md` | Oui | shaper |
| `{projectPath}/packages/<nom>/verification.md` | Oui | shaper |

### Verification du status

Le package.md doit avoir un status valide :
- `executed` : OK, le verifier peut commencer
- `verifying` : OK, reprise d'une verification en cours
- Autres : Refuse et suggere l'etape manquante

Si le status n'est pas valide :
- `pending`, `shaping`, `shaped` -> `/ship:execute` d'abord
- `executing` -> Attendre que l'executor termine
- Pas de package.md -> `/ship:shape`

## Detection du package actif

Si aucun package n'est specifie :
1. Chercher les packages avec status `executed` ou `verifying`
2. Si un seul : l'utiliser
3. Si plusieurs : demander a l'utilisateur
4. Si aucun : suggerer `/ship:execute`

## Comportement de relais (IMPORTANT)

Tu es un **relais transparent** entre l'agent et l'utilisateur.

Quand l'agent te retourne une question pour l'utilisateur (verification manuelle) :
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

1. **Verifier les prerequis** : package.md avec status executed, verification.md

2. **Identifier le package et scope** :
   - Si un package est fourni en argument -> utiliser ce package
   - Sinon -> detecter le package avec status executed
   - Utiliser le current_scope du package.md

3. **Lancer l'agent ship-verifier** qui va :
   - Lire package.md et verification.md
   - Executer les verifications automatiques (tests, linter, etc.)
   - Demander les verifications manuelles via AskUserQuestion
   - Mettre a jour les statuts dans verification.md
   - Decider : done (succes) ou executing (echec, retour executor)
   - Generer le rapport de verification

## Syntaxe

```
/ship:verify
```

Verifie le scope courant du package actif (detecte automatiquement).

```
/ship:verify auth
```

Verifie le scope courant du package "auth".

## Output

La verification produira :
- `verification.md` mis a jour avec les statuts des criteres
- `package.md` mis a jour :
  - Succes : `status: done`, scope ajoute a `scopes_completed`
  - Echec : `status: executing` (retour a l'executor)
- Rapport de verification affiche

## Exemples

```
/ship:verify
```

Detecte automatiquement le package avec status `executed` et verifie son scope courant.

```
/ship:verify auth
```

Verifie le scope courant du package "auth".

## Gestion des erreurs

### Status invalide

Si le status du package n'est pas `executed` ou `verifying` :
```
Ce package a le status "shaped". Il doit d'abord etre execute.
Lancez /ship:execute pour implementer ce package.
```

### Pas de criteres pour le scope

Si verification.md ne contient pas de criteres pour le scope courant :
```
Aucun critere de verification trouve pour le scope-1.
Verifiez que verification.md contient des criteres avec `scope: scope-1`.
```

### Echec de verification

Si des criteres blocking echouent :
```
## Verification echouee

Le scope `scope-1` n'a pas passe les verifications.

### Criteres en echec
- VER-S1-001 : Les tests unitaires passent
- VER-S1-003 : Le build compile sans erreur

Le package retourne a l'executor pour correction.
Lancez /ship:execute apres correction.
```

### Limite de tentatives

Si le nombre de tentatives depasse le maximum :
```
## Attention : Limite de tentatives atteinte

Le scope `scope-1` a echoue 5 fois.

Options :
1. Revoir les criteres de verification (peut-etre trop stricts)
2. Escalader a un humain pour diagnostic
3. Forcer la validation (non recommande)
```
