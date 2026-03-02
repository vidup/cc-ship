---
name: ship:architect
description: "Lance l'agent Architect pour definir l'architecture technique"
---

# Commande architect

Definit l'architecture technique basee sur les requirements.

## Instructions

### Resolution du projet (PREMIERE ETAPE)

1. Lire `cc-ship.json` a la racine du repo
2. Resoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-architect` en utilisant le tool Task avec les parametres suivants:

```
subagent_type: ship-architect
prompt: "Le chemin du projet est {projectPath}. [Le contexte de l'utilisateur ou 'Propose une architecture basee sur les requirements']"
```

## Syntaxe

```
/ship:architect
/ship:architect --propose    (forcer le mode proposition)
/ship:architect --validate   (valider une architecture existante)
```

## Prerequis

Un requirements.md doit exister dans `{projectPath}/requirements.md`.

**Si aucun requirements.md n'existe** :
> "Je ne trouve pas de requirements dans `{projectPath}/requirements.md`. Lance d'abord `/ship:specify` pour creer les requirements, puis reviens ici."

**Si le PRD n'existe pas** :
> "Note: Je ne trouve pas de PRD dans `{projectPath}/prd.md`. Je vais travailler uniquement avec les requirements."

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
- Dire "l'agent te demande si..." au lieu d'utiliser AskUserQuestion

**Ce que tu fais TOUJOURS** :
- Utiliser AskUserQuestion avec la question exacte de l'agent
- Passer la reponse de l'utilisateur a l'agent
- Continuer jusqu'a ce que l'agent ait termine

## Comportement attendu

1. Verifier que `{projectPath}/requirements.md` existe
2. L'agent va:
   - Lire le requirements.md et le PRD (si present)
   - Analyser la codebase existante
   - Verifier que les exigences non-fonctionnelles sont suffisantes
   - Demander le mode de travail (proposition vs validation)
   - Proposer ou valider l'architecture
   - Justifier les choix techniques
   - Identifier les risques et mitigations
   - Produire l'architecture dans `{projectPath}/architecture.md`

## Gestion des flags

### `--propose`

Force le mode proposition sans demander a l'utilisateur.
Passe ce contexte a l'agent : "L'utilisateur veut une proposition d'architecture."

### `--validate`

Force le mode validation.
Passe ce contexte a l'agent : "L'utilisateur veut valider une architecture qu'il a en tete."

## Exemple d'utilisation

```
/ship:architect
/ship:architect --propose
/ship:architect --validate
```

## Output

**Fichier genere** (dans le dossier projet) :
- `architecture.md` : Le document d'architecture technique

**Structure du architecture.md** :
- Vue d'ensemble (type d'architecture, justification)
- Diagramme de haut niveau (ASCII)
- Composants principaux (responsabilite, techno, justification, interfaces)
- Choix technologiques (tableau avec alternatives)
- Exigences NF adressees (mapping REQ-NF -> solution)
- Risques techniques et mitigations
- Securite (authentification, autorisation, donnees sensibles)
- Questions ouvertes (si presentes)

## Etape suivante

`/ship:split` pour decouper le projet en packages livrables
