---
name: ship-amending
description: "Guidelines et techniques pour amender le mapping ou les scopes d'un package existant"
user-invocable: false
---

# Skill: Amending

Ce skill fournit les guidelines pour amender chirurgicalement le mapping ou les scopes d'un package existant.

## Principes fondamentaux

### 1. Precision chirurgicale

Modifier uniquement ce qui est demande. Ne pas reecrire un fichier entier pour changer un scope. Utiliser Edit plutot que Write quand c'est possible.

### 2. Immuabilite du complete

Un scope dans `scopes_completed` ne peut JAMAIS etre modifie. C'est la regle la plus importante. Si l'utilisateur veut modifier un scope complete, proposer un nouveau scope a la place.

### 3. Coherence package ↔ verification

Toute modification dans package.md DOIT etre refletee dans verification.md, et inversement. Les deux fichiers sont toujours en sync.

### 4. Validation avant ecriture

TOUJOURS presenter les changements proposes a l'utilisateur avant d'ecrire. Pas d'exception.

---

## Types d'amendements mapping

### Ajout de package

1. Definir le perimetre du nouveau package
2. Mapper les exigences couvertes
3. Mettre a jour le graphe de dependances
4. Recalculer l'ordre d'implementation
5. Ecrire mapping.md mis a jour

### Suppression de package

1. Verifier que le package n'est PAS en status `done`
2. Verifier qu'aucune exigence ne devient orpheline
3. Redistribuer les exigences si necessaire
4. Mettre a jour les dependances (supprimer les references)
5. Recalculer l'ordre d'implementation
6. Ecrire mapping.md mis a jour

### Modification de package

1. Comprendre le changement (exigences, perimetre, dependances)
2. Verifier le status du package :
   - `done` → **REFUSE**
   - `shaped`/`executing`/`executed` → **CASCADE** vers package.md/verification.md
   - `pending` ou non shape → modification libre
3. Mettre a jour mapping.md
4. Si cascade : enchainer sur l'amendement des scopes

### Mise a jour du graphe de dependances

Quand un package est ajoute, supprime ou modifie :
- Recalculer les dependances entre packages
- Verifier l'absence de cycles (le graphe doit rester un DAG)
- Mettre a jour l'ordre d'implementation
- Mettre a jour les vagues si elles existent

---

## Types d'amendements scope

### Ajout en fin

Le cas le plus simple et le moins risque.

1. Ajouter le scope apres le dernier scope existant
2. Ajouter la section criteres correspondante dans verification.md
3. Pas de renumerotation necessaire
4. Status : reset vers `shaped` si necessaire

### Injection au milieu

Plus complexe, necessite une renumerotation.

1. Identifier le point d'insertion (entre scope N et N+1)
2. Verifier que le scope N n'est pas dans `scopes_completed` ET que le nouveau scope ne viole pas les dependances
3. Inserer le nouveau scope
4. Renumeroter les scopes suivants (N+1 devient N+2, etc.)
5. Mettre a jour verification.md (inserer la section + renumeroter)
6. Mettre a jour `current_scope` dans le frontmatter si necessaire
7. Mettre a jour `scopes_completed` si les identifiants changent
8. Status : reset vers `shaped`

### Modification d'un scope existant

1. Verifier que le scope n'est PAS dans `scopes_completed`
2. Identifier ce qui change : truths, artifacts, key links
3. Appliquer les modifications
4. Mettre a jour les criteres correspondants dans verification.md
5. Status : reset vers `shaped` si le package etait en `executing`/`executed`/`done`

### Suppression d'un scope

1. Verifier que le scope n'est PAS dans `scopes_completed`
2. Supprimer le scope de package.md
3. Supprimer la section criteres de verification.md
4. Renumeroter les scopes suivants si necessaire
5. Mettre a jour `current_scope` et `scopes_completed` si les identifiants changent
6. Status : reset vers `shaped` si necessaire

---

## Regles de sync verification.md

| Action sur package.md | Action sur verification.md |
|----------------------|---------------------------|
| Scope ajoute | Ajouter section criteres correspondante |
| Scope modifie (truths changes) | Mettre a jour descriptions de criteres |
| Scope modifie (artifacts changes) | Mettre a jour criteres lies aux artifacts |
| Scope supprime | Supprimer section criteres |
| Scopes renumerotes | Renumeroter sections criteres |

### Regles des criteres

Quand un scope est ajoute ou modifie, les criteres doivent suivre les memes regles que le shaping :
- `decision: auto` si verifiable par l'agent (tests, lint, build)
- `decision: manual` si necessite l'humain (UI, UX)
- `blocking: blocking` si critique, `warning` ou `info` sinon

---

## Regles de reset status

### Quand resetter

| Status actuel | Reset necessaire ? | Raison |
|---------------|-------------------|--------|
| `shaped` | Non | Le package n'est pas encore en execution |
| `executing` | Oui → `shaped` | Les scopes futurs changent, il faut re-planifier |
| `executed` | Oui → `shaped` | Idem, le scope execute doit etre re-verifie |
| `done` | Oui → `shaped` | Ajout de nouveaux scopes a completer |

### Quand NE PAS resetter

- Quand le status est `shaped` et qu'on modifie des scopes → pas de changement
- Quand on modifie uniquement le mapping sans impacter un package shape

### Communication du reset

Toujours avertir l'utilisateur :
```
Le status du package sera resete de [ancien] a shaped.
Consequence : l'execution devra reprendre depuis le prochain scope non complete.
```

---

## Analyse d'impact

### Checklist avant modification mapping

- [ ] Le package cible n'est pas en status `done`
- [ ] Les exigences redistribuees ne deviennent pas orphelines
- [ ] Le graphe de dependances reste un DAG (pas de cycles)
- [ ] Les packages shapes affectes seront cascades

### Checklist avant modification scope

- [ ] Le scope cible n'est pas dans `scopes_completed`
- [ ] Le package n'est pas en status `verifying` ou `shaping`
- [ ] Les modifications sont coherentes avec le mapping
- [ ] verification.md sera mis a jour en sync
- [ ] Le reset de status est communique si necessaire

---

## Anti-patterns a eviter

| Anti-pattern | Probleme | Solution |
|-------------|----------|----------|
| Reecrire tout le fichier | Perte de contenu non modifie | Edits chirurgicaux |
| Modifier un scope complete | Violation d'immuabilite | Proposer un nouveau scope |
| Oublier verification.md | Desync package ↔ verification | Toujours modifier les deux |
| Reset silencieux | Utilisateur surpris par le changement de status | Toujours avertir |
| Cascader sans verifier | Modification mapping sans impact sur package.md | Verifier le status avant |
