---
name: ship:prd
description: "Transforme un brief en PRD structuré"
---

# Commande prd

Transforme un brief existant en Product Requirements Document (PRD) structuré.

## Instructions

### Résolution du projet (PREMIÈRE ÉTAPE)

1. Lire `cc-ship.json` à la racine du repo
2. Résoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-brainstormer-prd` en utilisant le tool Task avec les paramètres suivants:

```
subagent_type: ship-brainstormer-prd
prompt: "Le chemin du projet est {projectPath}. [Le contexte de l'utilisateur ou 'Transforme le brief en PRD']"
```

## ⚠️ Prérequis

Un brief doit exister dans `{projectPath}/brief.md`.

**Si aucun brief n'existe** :
> "Je ne trouve pas de brief dans `{projectPath}/brief.md`. Lance d'abord `/ship:brainstorm` pour créer un brief, puis reviens ici."

## ⚠️ Comportement de relais (IMPORTANT)

Tu es un **relais transparent** entre l'agent et l'utilisateur.

Quand l'agent te retourne une question pour l'utilisateur :
1. **Utilise `AskUserQuestion`** pour la poser exactement comme l'agent l'a formulée
2. Récupère la réponse de l'utilisateur
3. Relance l'agent avec cette réponse

**Ce que tu ne fais JAMAIS** :
- ❌ Résumer les questions de l'agent
- ❌ Reformuler ce que l'agent demande
- ❌ Répondre à la place de l'utilisateur
- ❌ Dire "l'agent te demande si..." au lieu d'utiliser AskUserQuestion

**Ce que tu fais TOUJOURS** :
- ✅ Utiliser AskUserQuestion avec la question exacte de l'agent
- ✅ Passer la réponse de l'utilisateur à l'agent
- ✅ Continuer jusqu'à ce que l'agent ait terminé

## Comportement attendu

1. Vérifier que `{projectPath}/brief.md` existe
2. L'agent va:
   - Lire le brief et la research (si présente)
   - Poser des questions pour clarifier les features
   - Creuser chaque fonctionnalité identifiée
   - Produire un PRD structuré dans `{projectPath}/prd.md`

## Exemple d'utilisation

```
/ship:prd
```

## Output

**Fichier généré** (dans le dossier projet) :
- `prd.md` : Le PRD structuré

**Structure du PRD** :
- Vue d'ensemble (problème, solution, objectifs, personas)
- Fonctionnalités détaillées (description, utilisateur, valeur, comportements, edge cases, priorité)
- Hors scope explicite
- Contraintes connues
- Questions résolues / Questions ouvertes

## Étape suivante

`/ship:specify` pour transformer le PRD en exigences techniques (SRS)
