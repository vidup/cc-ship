---
name: ship:help
description: "Affiche la liste des commandes ship disponibles"
---

# Ship v2 - Aide

Un toolkit pour augmenter Claude Code avec un workflow pragmatique centré sur
l'interaction avec l'humain.

## Philosophie

- **Pragmatisme** : Get shit done, sans bullshit
- **Contrôle humain** : L'utilisateur valide, intervient, décide
- **Shaping avant coding** : On creuse la fonctionnalité à fond, ensuite
  l'implémentation suit

---

## Commandes par phase

### Phase 1 - Idéation

| Commande           | Description                                      |
| ------------------ | ------------------------------------------------ |
| `/ship:brainstorm` | Transforme une idée vague en brief structuré     |
| `/ship:prd`        | Creuse le brief en Product Requirements Document |

### Phase 2 - Spécification

| Commande          | Description                                |
| ----------------- | ------------------------------------------ |
| `/ship:specify`   | Transforme le PRD en exigences (SRS)       |
| `/ship:architect` | Propose ou valide l'architecture technique |
| `/ship:split`     | Découpe en packages livrables              |

### Phase 3 - Exécution

| Commande        | Description                   |
| --------------- | ----------------------------- |
| `/ship:shape`   | Planifie UN package en scopes |
| `/ship:execute` | Implémente le scope courant   |
| `/ship:verify`  | Vérifie l'implémentation      |

### Orchestration

| Commande       | Description                                             |
| -------------- | ------------------------------------------------------- |
| `/ship:init`   | Initialise un nouveau projet ship                       |
| `/ship:next`   | Détecte l'état et propose l'étape suivante (interactif) |
| `/ship:status` | Affiche l'état du projet                                |
| `/ship:help`   | Affiche cette aide                                      |

---

## Flow

```
BRAINSTORM → PRD → SPECIFY → ARCHITECT → SPLIT
                                          ↓
                    ┌─────────────────────┘
                    ↓
              Pour CHAQUE package:
              SHAPE → EXECUTE ←→ VERIFY
```

---

## Structure des fichiers

```
cc-ship.json                      # Configuration multi-projet
{projectsDir}/
└── {currentProject}/             # Dossier projet actif
    ├── brief.md                  # Output brainstormer
    ├── research.md               # Output brainstormer (optionnel)
    ├── prd.md                    # Output brainstormer-prd
    ├── requirements.md           # Output specifier (SRS)
    ├── architecture.md           # Output architect
    └── packages/
        ├── mapping.md            # Output splitter
        └── <nom>/
            ├── package.md        # Output shaper
            └── verification.md   # Output shaper
```

Par défaut, `projectsDir` = `.ship`. Configurable via `cc-ship.json`.

---

## Agents

| Agent                 | Rôle                                                       |
| --------------------- | ---------------------------------------------------------- |
| ship-brainstormer     | Transforme une idée vague en brief structuré               |
| ship-brainstormer-prd | Creuse le brief en PRD détaillé                            |
| ship-specifier        | Définit les exigences fonctionnelles et non-fonctionnelles |
| ship-architect        | Propose ou valide l'architecture technique                 |
| ship-splitter         | Découpe en packages livrables                              |
| ship-shaper           | Planifie un package en scopes                              |
| ship-executor         | Implémente le scope courant                                |
| ship-verifier         | Vérifie l'implémentation                                   |

---

## Pour commencer

- `/ship:init mon-projet` pour initialiser un nouveau projet
- `/ship:next` pour démarrer ou reprendre le workflow
- `/ship:brainstorm` pour démarrer le brainstorming
- `/ship:status` pour voir où tu en es
