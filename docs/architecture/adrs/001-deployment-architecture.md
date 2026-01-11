# ADR-001: Deployment Architecture

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo V3 nécessite une infrastructure de déploiement pour héberger :
- Next.js 15 application (frontend + API routes)
- Webhooks Stripe (endpoint public, <2s timeout requis)
- Fraud Detection Engine (traitement intensif)
- Background jobs (AI explanation generation)

Nous avons besoin d'une solution qui :
- Permet un time-to-market rapide (6 semaines MVP)
- Scale automatiquement
- Minimise le DevOps overhead
- Reste dans le budget (<$50/mois pour démarrer)

---

## Decision

**Nous choisissons : Vercel Full Serverless**

```
Architecture:
├─ Next.js App Router (Serverless Functions)
├─ API Routes → Lambda-style functions
├─ Webhooks → Serverless functions (15s timeout)
├─ Frontend → Edge cached
├─ Database → Neon PostgreSQL (Serverless)
├─ Cache → Upstash Redis (Serverless)
└─ Background Jobs → Trigger.dev
```

---

## Alternatives Considered

### Alternative 1: Hybrid (Vercel Frontend + Backend Dédié)
- **Avantages**: Plus de contrôle, pas de limites serverless, coûts prévisibles
- **Inconvénients**: DevOps requis, deux codebases à synchroniser, setup initial plus long
- **Coût**: ~$100-200/mois
- **Rejeté car**: Complexité trop élevée pour MVP, timeline serrée

### Alternative 2: Cloudflare Workers (Edge-First)
- **Avantages**: Ultra-rapide (<50ms), scaling illimité, prix bas ($5/mois)
- **Inconvénients**: Contraintes Workers (50ms CPU time), learning curve, Fraud Engine doit être ultra-optimisé
- **Coût**: ~$5-50/mois
- **Rejeté car**: Risque technique trop élevé pour MVP, peut migrer plus tard

---

## Consequences

### Positive
- ✅ **Zero DevOps**: Vercel gère scaling, monitoring, deploys
- ✅ **Time-to-market rapide**: Deploy en 30 secondes, focus sur features
- ✅ **Auto-scaling**: De 0 à 10K req/s automatiquement
- ✅ **Edge network global**: Latence minimale mondiale
- ✅ **Coût démarrage bas**: $0-20/mois pour les premiers mois
- ✅ **Écosystème mature**: Next.js + Vercel = battle-tested
- ✅ **Preview deployments**: Un deploy par PR automatiquement

### Negative
- ⚠️ **Vendor lock-in Vercel**: Migration future vers autre plateforme = complexe
- ⚠️ **Cold starts**: 50-200ms possibles (mitigé par edge caching)
- ⚠️ **Limites serverless**: 10s timeout API routes, 15s webhooks (suffisant pour nous)
- ⚠️ **Coûts peuvent augmenter**: Si trafic massif (>1M req/mois), surveiller

### Neutral
- 🔄 **Migration path exists**: Si croissance massive, migration vers Cloudflare Workers possible plus tard
- 🔄 **Monorepo compatible**: Turborepo fonctionne parfaitement avec Vercel

---

## Implementation Notes

1. **Setup Vercel Project**:
   ```bash
   vercel init
   vercel env add DATABASE_URL
   vercel env add STRIPE_SECRET_KEY
   # ... autres env vars
   ```

2. **Configure vercel.json**:
   ```json
   {
     "framework": "nextjs",
     "regions": ["iad1"],
     "functions": {
       "app/api/webhooks/stripe/[accountId]/route.ts": {
         "maxDuration": 15
       }
     }
   }
   ```

3. **Monitoring**:
   - Vercel Analytics pour latency
   - Sentry pour errors
   - Logs dans Better Stack

---

## Related Decisions
- ADR-006: Background Jobs (Trigger.dev choisi pour s'intégrer avec serverless)
- ADR-008: Real-Time Strategy (SSE choisi car compatible serverless)
- ADR-009: Observability (Stack optimisée pour Vercel)

---

## Review Schedule
- **3 mois**: Revoir si limites serverless posent problème
- **6 mois**: Analyser coûts vs alternatives
- **12 mois**: Décider si migration vers Cloudflare Workers justifiée
