---
name: ship:split
description: "Lance l'agent Splitter pour decouper le projet en packages livrables"
---

# Commande split

Decoupe le projet en packages livrables et cree le mapping exigences <-> packages.

## Instructions

### Resolution du projet (PREMIERE ETAPE)

1. Lire `cc-ship.json` a la racine du repo
2. Resoudre le chemin : `{projectsDir}/{currentProject}/`
3. Si `cc-ship.json` n'existe pas OU `currentProject` est null → ERREUR : "Lance `/ship:init` ou `/ship:next` d'abord pour initialiser un projet."
4. Utiliser ce chemin partout au lieu de `.ship/`

### Lancement de l'agent

Tu dois lancer l'agent `ship-splitter` en utilisant le tool Task avec les parametres suivants:

```
subagent_type: ship-splitter
prompt: "Le chemin du projet est {projectPath}. [Le contexte de l'utilisateur ou 'Decoupe le projet en packages livrables']"
```

## Syntaxe

```
/ship:split
```

## Prerequis

Les fichiers suivants doivent exister :

- `{projectPath}/requirements.md` (obligatoire)
- `{projectPath}/architecture.md` (obligatoire)
- `{projectPath}/prd.md` (recommande)

**Si requirements.md n'existe pas** :
> "Je ne trouve pas de requirements dans `{projectPath}/requirements.md`. Lance d'abord `/ship:specify` pour creer les requirements, puis reviens ici."

**Si architecture.md n'existe pas** :
> "Je ne trouve pas d'architecture dans `{projectPath}/architecture.md`. Lance d'abord `/ship:architect` pour definir l'architecture, puis reviens ici."

**Si le PRD n'existe pas** :
> "Note: Je ne trouve pas de PRD dans `{projectPath}/prd.md`. Je vais travailler avec les requirements et l'architecture uniquement."

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

1. Verifier que `{projectPath}/requirements.md` et `{projectPath}/architecture.md` existent
2. L'agent va:
   - Lire les requirements, architecture et PRD (si present)
   - Identifier les frontieres naturelles
   - Proposer un decoupage en packages
   - Valider avec l'utilisateur
   - Creer le mapping exigences <-> packages
   - Identifier les dependances entre packages
   - Suggerer l'ordre d'implementation
   - Produire le mapping dans `{projectPath}/packages/mapping.md`

## Exemple d'utilisation

```
/ship:split
```

## Output

**Fichier genere** (dans le dossier projet) :
- `packages/mapping.md` : Le document de mapping

**Structure du mapping.md** :
- Vue d'ensemble (nombre de packages, approche de decoupage)
- Packages identifies (perimetre, exigences, dependances, complexite)
- Matrice de mapping (exigence -> package)
- Exigences transverses
- Graphe de dependances (Mermaid)
- Ordre d'implementation suggere (vagues)

## Etape suivante

`/ship:shape <nom-package>` pour planifier un package specifique
