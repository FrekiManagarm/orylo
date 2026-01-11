# Architecture Decision Records (ADRs)

**Last Updated**: 2026-01-11  
**Status**: Active

---

## 📖 Qu'est-ce qu'un ADR ?

Un **Architecture Decision Record (ADR)** documente une décision architecturale importante prise pendant le développement d'Orylo V3.

Chaque ADR capture :
- **Le contexte** : Pourquoi cette décision était nécessaire
- **La décision** : Qu'est-ce qui a été choisi
- **Les alternatives** : Qu'est-ce qui a été considéré et rejeté
- **Les conséquences** : Impact positif, négatif, et neutre

---

## 📚 Liste des ADRs

### Core Architecture

| ADR | Titre | Status | Date |
|-----|-------|--------|------|
| [001](./001-deployment-architecture.md) | Deployment Architecture | ✅ Accepted | 2026-01-11 |
| [002](./002-database-strategy.md) | Database Strategy | ✅ Accepted | 2026-01-11 |
| [003](./003-cache-architecture.md) | Cache Architecture | ✅ Accepted | 2026-01-11 |

### Fraud Detection Engine

| ADR | Titre | Status | Date |
|-----|-------|--------|------|
| [004](./004-detector-execution-strategy.md) | Detector Execution Strategy | ✅ Accepted | 2026-01-11 |
| [005](./005-type-system.md) | Type System (Branded Types) | ✅ Accepted | 2026-01-11 |

### Application Layer

| ADR | Titre | Status | Date |
|-----|-------|--------|------|
| [006](./006-background-jobs.md) | Background Jobs Architecture | ✅ Accepted | 2026-01-11 |
| [007](./007-api-architecture.md) | API Architecture Pattern | ✅ Accepted | 2026-01-11 |
| [008](./008-realtime-strategy.md) | Real-Time Updates Strategy | ✅ Accepted | 2026-01-11 |

### Operations

| ADR | Titre | Status | Date |
|-----|-------|--------|------|
| [009](./009-observability-stack.md) | Observability Stack (Low-Cost) | ✅ Accepted | 2026-01-11 |
| [010](./010-security-architecture.md) | Security Architecture (Multi-Layer) | ✅ Accepted | 2026-01-11 |

---

## 🔄 Lifecycle d'un ADR

```
DRAFT → PROPOSED → ACCEPTED → DEPRECATED → SUPERSEDED
```

- **DRAFT** : En cours de rédaction
- **PROPOSED** : Proposé pour review
- **ACCEPTED** : Décision validée et implémentée
- **DEPRECATED** : Plus recommandé mais encore en place
- **SUPERSEDED** : Remplacé par un nouvel ADR

---

## 📝 Comment Créer un Nouvel ADR

### 1. Template

```markdown
# ADR-XXX: Titre de la Décision

**Date**: YYYY-MM-DD  
**Status**: DRAFT  
**Deciders**: Noms

---

## Context

Pourquoi cette décision est nécessaire ?
Quel problème résolvons-nous ?
Quelles sont les contraintes ?

---

## Decision

Quelle solution avons-nous choisie ?
Comment sera-t-elle implémentée ?

---

## Alternatives Considered

### Alternative 1: Nom
- Avantages
- Inconvénients
- Pourquoi rejetée

---

## Consequences

### Positive
- ✅ Avantage 1
- ✅ Avantage 2

### Negative
- ⚠️ Inconvénient 1
- ⚠️ Inconvénient 2

### Neutral
- 🔄 Point neutre 1

---

## Implementation Notes

Détails techniques pour implémenter cette décision.

---

## Related Decisions
- ADR-XXX: Autre décision liée

---

## Review Schedule
- X mois: Vérifier si...
```

### 2. Numérotation

Les ADRs sont numérotés séquentiellement : `001`, `002`, `003`, etc.

**Prochain ADR disponible** : `011`

### 3. Process

1. **Créer le fichier** : `docs/architecture/adrs/011-titre.md`
2. **Remplir le template** avec contexte et alternatives
3. **Review** : Faire reviewer par l'équipe
4. **Update status** : DRAFT → PROPOSED → ACCEPTED
5. **Update ce README** : Ajouter à la liste

---

## 🔍 Comment Utiliser les ADRs

### Pour les Développeurs

**Avant d'implémenter une feature** :
1. Lire les ADRs liés (ex: ADR-004 avant d'ajouter un detector)
2. Comprendre les décisions et contraintes
3. Respecter les patterns établis

**Si besoin de changer une décision** :
1. Créer un nouvel ADR qui supersede l'ancien
2. Expliquer pourquoi le changement est nécessaire
3. Documenter la migration path

### Pour les Product Managers

**Lors de planning** :
1. Consulter les ADRs pour comprendre les limitations techniques
2. Utiliser les "Review Schedule" pour planifier les re-évaluations
3. Référencer les ADRs dans les user stories si pertinent

### Pour les Nouveaux Membres

**Onboarding** :
1. Lire les 10 ADRs initiaux (ordre recommandé : 001 → 010)
2. Comprendre le "pourquoi" derrière chaque décision
3. Poser des questions si quelque chose n'est pas clair

---

## 📊 Statistiques

- **Total ADRs** : 10
- **Accepted** : 10
- **Deprecated** : 0
- **Superseded** : 0
- **Last review** : 2026-01-11

---

## 🔗 Ressources

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions (Michael Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)

---

## 📅 Review Calendar

| Date | ADR | Action |
|------|-----|--------|
| 2026-02-11 | ADR-001 | Review si limites serverless problématiques (1 mois) |
| 2026-02-11 | ADR-002 | Vérifier performance overhead RLS < 1ms (1 mois) |
| 2026-02-11 | ADR-003 | Vérifier hit rates réels > 80% (1 mois) |
| 2026-02-11 | ADR-004 | Analyser distribution early exits (1 mois) |
| 2026-02-11 | ADR-005 | Collecter feedback équipe sur branded types (1 mois) |
| 2026-02-11 | ADR-006 | Vérifier coûts Trigger.dev réels (1 mois) |
| 2026-04-11 | ADR-007 | Analyser usage API endpoints (3 mois) |
| 2026-02-11 | ADR-008 | Analyser latency SSE réelle < 5s P95 (1 mois) |
| 2026-02-11 | ADR-009 | Vérifier volume errors/logs vs FREE tiers (1 mois) |
| 2026-02-11 | ADR-010 | Penetration testing (1 mois) |

---

*Pour toute question sur les ADRs, contacter : Mathieu Chambaud*
