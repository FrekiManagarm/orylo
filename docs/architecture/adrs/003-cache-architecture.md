# ADR-003: Cache Architecture

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Le Fraud Detection Engine doit être **ultra-rapide** (target: < 250ms P95) pour respecter le timeout webhook Stripe de 2s.

**Données fréquemment lues** (hot paths) :
- ✅ Custom Rules (changent rarement, lus à chaque transaction)
- ✅ Customer Trust Scores (changent peu, lus très souvent)
- ✅ Whitelist/Blacklist (changent peu, DOIVENT être ultra-rapides pour early exit)
- ✅ Fraud Rules Config (quasi-statiques)
- ❌ Velocity Metrics (NE PAS cacher, trop volatiles)

**Performance actuelle sans cache** :
- DB query custom rules : ~40ms
- DB query customer scores : ~30ms
- DB query whitelist : ~50ms
- **Total context building : ~200ms** (trop lent!)

**Target avec cache** :
- < 10ms pour context building
- Hit rate > 80%

**Contrainte** : Vercel Serverless = instances éphémères (pas de mémoire persistante entre requêtes)

---

## Decision

**Nous choisissons : Dual-Layer Cache (In-Memory + Redis)**

```
┌─────────────────────────────────────┐
│     SERVERLESS FUNCTION             │
│  ┌──────────────────────────────┐   │
│  │  L1: In-Memory (Map)         │   │ ← < 1ms (90% hits after warm)
│  │  TTL: 60s                    │   │
│  └──────────┬───────────────────┘   │
│             │ miss                  │
│  ┌──────────▼───────────────────┐   │
│  │  L2: Upstash Redis           │   │ ← 5-10ms (9% hits)
│  │  TTL: 5-15min                │   │
│  └──────────┬───────────────────┘   │
│             │ miss                  │
└─────────────┼───────────────────────┘
              │
     ┌────────▼────────┐
     │  PostgreSQL     │ ← 50-100ms (1% miss)
     └─────────────────┘
```

**Implementation** :
```typescript
// packages/fraud-engine/src/services/cache.service.ts
class DualLayerCache {
  private memoryCache = new Map<string, CachedItem>();
  private redis: Redis; // Upstash

  async get<T>(key: string): Promise<T | null> {
    // L1: In-Memory (< 1ms)
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expiresAt > Date.now()) {
      this.metrics.l1Hits++;
      return memCached.value as T;
    }

    // L2: Redis (5-10ms)
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      this.metrics.l2Hits++;
      // Warm L1
      this.memoryCache.set(key, {
        value: redisCached,
        expiresAt: Date.now() + 60_000, // 60s
      });
      return redisCached as T;
    }

    this.metrics.misses++;
    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Set both layers
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + 60_000, // L1: 60s
    });
    await this.redis.set(key, value, { ex: ttl }); // L2: configurable
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1
    for (const [key] of this.memoryCache) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    // Invalidate L2 (Redis pattern scan)
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**Cache TTLs Strategy** :
```typescript
const CACHE_CONFIG = {
  customRules: { ttl: 60, layer: 'L1+L2' },        // 1 min
  customerScores: { ttl: 300, layer: 'L2' },       // 5 min
  fraudRules: { ttl: 900, layer: 'L1+L2' },        // 15 min
  whitelist: { ttl: 300, layer: 'L1+L2' },         // 5 min (critical)
  blacklist: { ttl: 300, layer: 'L1+L2' },         // 5 min (critical)
  velocityMetrics: { ttl: 0, layer: 'NONE' },      // NO CACHE (volatile)
};
```

---

## Alternatives Considered

### Alternative 1: Redis Only (Single Layer)
```typescript
// Pas de L1, uniquement Redis
const data = await redis.get(key) ?? await db.query(...);
```

- **Avantages**: Plus simple, partagé entre instances, pas de cache inconsistency
- **Inconvénients**: Latency constante 5-10ms (vs < 1ms avec L1), sur 1000 req/s = 5-10s de latency cumulée
- **Rejeté car**: Performance pas optimale, L1 apporte 5-10x speedup

### Alternative 2: In-Memory Only (No Redis)
```typescript
// Juste Map en mémoire
const memCache = new Map();
const data = memCache.get(key) ?? await db.query(...);
```

- **Avantages**: Ultra-simple, ultra-rapide (<1ms), zero coût
- **Inconvénients**: **PAS partagé entre instances serverless**, chaque cold start = cache vide, hit rate faible (30-50%)
- **Rejeté car**: Serverless = instances éphémères, besoin de persistance entre instances

### Alternative 3: CDN Edge Cache (Cloudflare KV)
```typescript
// Cache at edge (ultra-distributed)
const data = await env.KV.get(key) ?? await db.query(...);
```

- **Avantages**: Ultra-rapide (<5ms), distribué mondialement
- **Inconvénients**: Vendor lock-in Cloudflare, nécessite Cloudflare Workers, eventually consistent (pas ideal pour fraud detection)
- **Rejeté car**: On utilise Vercel, pas Cloudflare (mais future option)

---

## Consequences

### Positive
- ✅ **Performance ultime**: L1 hit = < 1ms (90% des cas après warm-up)
- ✅ **Serverless-friendly**: Redis garde cache chaud entre instances
- ✅ **Hit rate élevé**: Target 80-90% (L1 + L2 combinés)
- ✅ **Cost-effective**: Upstash Redis = $0-10/mois pour démarrer
- ✅ **Évolutif**: Peut scale à millions de requêtes
- ✅ **Warm-up automatique**: L2 hit repopule L1

### Negative
- ⚠️ **Complexité**: 2 layers à gérer (set, get, invalidate)
- ⚠️ **Invalidation délicate**: Doit invalider L1 ET L2 simultanément
- ⚠️ **Coût Redis**: $10-30/mois selon usage (mais acceptable)
- ⚠️ **Stale data possible**: Entre invalidation et propagation (~1-60s)

### Neutral
- 🔄 **Monitoring requis**: Track hit rates par layer (dashboard admin)
- 🔄 **Tuning TTLs**: Ajuster selon usage réel

---

## Implementation Notes

### 1. Event-Based Invalidation

```typescript
// Invalider cache quand données changent
export async function updateCustomRule(ruleId: string, updates: Partial<CustomRule>) {
  // 1. Update DB
  await db.update(customRules).set(updates).where(eq(customRules.id, ruleId));
  
  // 2. Invalidate cache
  await cache.invalidate(`rules:${rule.organizationId}`);
}

// Invalider sur dispute (customer score change)
export async function handleDisputeCreated(dispute: Stripe.Dispute) {
  await cache.invalidate(`trust:${dispute.charge.customer}`);
}
```

### 2. Cache Key Strategy

```typescript
// Pattern: {type}:{organizationId}:{resourceId?}
const keys = {
  rules: (orgId: OrganizationId) => `rules:${orgId}`,
  trustScore: (customerId: CustomerId) => `trust:${customerId}`,
  whitelist: (orgId: OrganizationId) => `whitelist:${orgId}`,
  blacklist: (orgId: OrganizationId) => `blacklist:${orgId}`,
};
```

### 3. Metrics Dashboard

```typescript
// GET /api/admin/cache/metrics
export async function GET() {
  const stats = cache.getStats();
  return Response.json({
    l1: {
      hits: stats.l1Hits,
      hitRate: stats.l1Hits / (stats.l1Hits + stats.l2Hits + stats.misses),
      size: stats.l1Size,
    },
    l2: {
      hits: stats.l2Hits,
      hitRate: stats.l2Hits / (stats.l2Hits + stats.misses),
    },
    overall: {
      hitRate: (stats.l1Hits + stats.l2Hits) / (stats.l1Hits + stats.l2Hits + stats.misses),
      avgLatency: stats.avgLatency,
    },
  });
}
```

### 4. Upstash Redis Setup

```bash
# Create Upstash Redis instance
# https://upstash.com

# Add to .env
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=AXX...
```

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});
```

---

## Performance Impact

**Before Cache** :
```
Context Building: 200ms
├─ Fetch Custom Rules: 40ms
├─ Fetch Customer Score: 30ms
├─ Fetch Whitelist: 50ms
├─ Fetch Card Data: 40ms
└─ Fetch Velocity: 40ms
```

**After Cache (80% hit rate)** :
```
Context Building: 60ms (average)
├─ Custom Rules (L1 hit): 1ms ✅
├─ Customer Score (L2 hit): 8ms ✅
├─ Whitelist (L1 hit): 1ms ✅
├─ Card Data (miss): 40ms
└─ Velocity (no cache): 40ms
```

**Improvement : -70% latency** 🔥

---

## Related Decisions
- ADR-001: Deployment (Serverless = besoin de L2 persistant)
- ADR-004: Detector Execution (Cache permet early exit ultra-rapide sur blacklist)

---

## Review Schedule
- **2 semaines**: Vérifier hit rates réels (target: >80%)
- **1 mois**: Analyser coûts Upstash vs bénéfice performance
- **3 mois**: Revoir TTLs selon patterns d'usage réels
