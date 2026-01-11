# ADR-009: Observability Stack (Low-Cost)

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo en production nécessite **visibilité complète** pour :

**1. Performance Monitoring** :
- Latency P50/P95/P99 par route API
- Webhook processing time
- Database query time
- Cache hit rate

**2. Error Tracking** :
- Exceptions avec stack traces
- Context (user, org, transaction)
- Frequency & impact

**3. Structured Logging** :
- Request/response logs
- Fraud detection pipeline logs
- Business events (BLOCK decision, etc.)

**4. Custom Metrics** :
- Fraud detections par decision type
- Detectors execution stats
- System health score

**Contraintes CRITIQUES** :
- 💰 **Budget** : Quasi-zéro (~$0-5/mois max pour démarrer)
- 🚀 **MVP-first** : Simple, pas over-engineering
- 📈 **Scalable** : Upgrade path quand croissance

**Volume estimé** :
- Phase 1 : 1K-10K req/jour, 10-50 errors/jour
- Phase 2 : 10K-100K req/jour, 100-500 errors/jour
- Phase 3 : 100K-1M req/jour, 500-2000 errors/jour

---

## Decision

**Nous choisissons : Low-Cost Stack (Vercel + Sentry FREE + Better Stack FREE + DIY Metrics)**

```
OBSERVABILITY STACK:
├─ Performance: Vercel Analytics (FREE) ✅
├─ Errors: Sentry FREE Tier (5K errors/mois) ✅
├─ Logs: Better Stack Logtail FREE (1GB/mois) ✅
├─ Metrics: Custom DIY in-memory ✅
└─ Total Cost: $0/mois pour Phase 1-2 🎉
```

---

### Component 1: Vercel Analytics (Performance)

**Included gratuit avec Vercel** :

```typescript
// Zero configuration needed!
// Automatic metrics in Vercel Dashboard:

- Request latency (P50, P95, P99)
- Status codes distribution (2xx, 4xx, 5xx)
- Geographic distribution
- Edge vs Serverless function time
- Memory usage
- Cold starts frequency
```

**Access** : `https://vercel.com/dashboard/analytics`

---

### Component 2: Sentry (Error Tracking)

**FREE Tier** : 5,000 errors/mois

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring (10% sample)
  tracesSampleRate: 0.1,
  
  environment: process.env.NODE_ENV,
  
  // Scrub sensitive data
  beforeSend(event, hint) {
    // Remove PII
    if (event.request?.data) {
      delete event.request.data.paymentMethod;
      delete event.request.data.cardNumber;
      delete event.request.data.email;
    }
    return event;
  },
  
  // Ignore known errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

**Usage** :

```typescript
// Automatic error capture
try {
  await fraudEngine.detect(context);
} catch (error) {
  // Sentry captures automatically + sends to dashboard
  Sentry.captureException(error, {
    tags: {
      organizationId,
      detectionVersion: 'v3',
      feature: 'fraud-detection',
    },
    contexts: {
      transaction: {
        paymentIntentId,
        amount: context.amount,
        decision: 'error',
      },
    },
    level: 'error',
  });
  throw error;
}

// Manual events
Sentry.captureMessage('Unusual spike detected', {
  level: 'warning',
  tags: { organizationId },
});
```

**Upgrade Path** : $29/mois pour 50K errors quand dépassé

---

### Component 3: Better Stack Logtail (Structured Logs)

**FREE Tier** : 1GB logs/mois (~1-2M log lines)

```typescript
// lib/logger.ts
import { Logger } from "tslog";
import axios from "axios";

const logtailToken = process.env.LOGTAIL_TOKEN;

export const logger = new Logger({
  name: "orylo",
  type: "json", // Structured JSON
  minLevel: process.env.NODE_ENV === "production" ? 2 : 0,
  
  attachedTransports: [
    // Console (local dev)
    (logObj) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify(logObj, null, 2));
      }
    },
    
    // Better Stack (production)
    ...(logtailToken ? [(logObj) => {
      // Send to Logtail (non-blocking)
      axios.post(
        'https://in.logtail.com',
        logObj,
        {
          headers: {
            'Authorization': `Bearer ${logtailToken}`,
            'Content-Type': 'application/json',
          },
        }
      ).catch(() => {
        // Silent fail (don't break app if logging fails)
      });
    }] : []),
  ],
});
```

**Usage** :

```typescript
// Fraud detection pipeline
logger.info("Fraud detection started", {
  organizationId,
  paymentIntentId,
  timestamp: Date.now(),
});

logger.info("Fraud detection completed", {
  organizationId,
  paymentIntentId,
  decision: result.decision,
  riskScore: result.riskScore,
  detectorsExecuted: result.factors.length,
  latency_ms: Date.now() - startTime,
  cacheHitRate: cacheStats.hitRate,
  earlyExit: result.earlyExit,
});

// Error with context
logger.error("Database query failed", {
  organizationId,
  query: 'fraudDetections.findMany',
  error: error.message,
  stack: error.stack,
});
```

**Better Stack Dashboard** : `https://logs.betterstack.com`
- Full-text search
- Live tail
- Filters par level, organizationId, etc.
- 3 jours retention (FREE tier)

**Upgrade Path** : $10/mois pour 50GB logs

---

### Component 4: Custom Metrics (DIY In-Memory)

**Zero cost, maximum flexibility** :

```typescript
// lib/metrics/in-memory-metrics.ts
class InMemoryMetrics {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  
  increment(key: string, value = 1) {
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }
  
  gauge(key: string, value: number) {
    this.gauges.set(key, value);
  }
  
  observe(key: string, value: number) {
    const values = this.histograms.get(key) || [];
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    
    this.histograms.set(key, values);
  }
  
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(values, 0.5),
            p95: this.percentile(values, 0.95),
            p99: this.percentile(values, 0.99),
          },
        ])
      ),
    };
  }
  
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
  
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const metrics = new InMemoryMetrics();
```

**Usage** :

```typescript
// Track fraud detections
metrics.increment('fraud.detections.total');
metrics.increment(`fraud.detections.${decision.toLowerCase()}`);

// Track latency
const startTime = Date.now();
await fraudEngine.detect(context);
metrics.observe('fraud.detection.latency_ms', Date.now() - startTime);

// Track cache
metrics.gauge('cache.hit_rate', cacheService.getHitRate());
metrics.increment('cache.l1.hits', l1Hits);
metrics.increment('cache.l2.hits', l2Hits);
```

**Dashboard Endpoint** :

```typescript
// app/api/admin/metrics/route.ts
export async function GET(request: Request) {
  await requireAdmin(request);
  
  const allMetrics = metrics.getMetrics();
  
  return Response.json({
    timestamp: Date.now(),
    uptime_seconds: process.uptime(),
    memory: process.memoryUsage(),
    metrics: allMetrics,
  });
}
```

**Upgrade Path** : Export vers Datadog/Prometheus plus tard si besoin

---

## Alternatives Considered

### Alternative 1: Datadog (All-in-One)

```typescript
// APM + Logs + Metrics + Tracing in one
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: '...',
  clientToken: '...',
  service: 'orylo',
});
```

**Avantages** :
- Tout-en-un (APM, logs, metrics, tracing)
- Puissant (corrélations, anomaly detection)
- Enterprise-grade

**Inconvénients** :
- **COÛT** : $15-50 par host/mois = $200-500/mois minimum ⚠️
- Overkill pour MVP
- Complexité setup

**Rejeté car** : Budget contrainte (#1 priorité)

---

### Alternative 2: Self-Hosted (Grafana + Loki + Prometheus)

**Avantages** : Full control, zero SaaS cost

**Inconvénients** :
- **Besoin de serveur dédié** pour monitoring stack
- **DevOps overhead énorme** : Setup, maintenance, updates
- **Pas serverless-friendly**

**Rejeté car** : Time-to-market (6 semaines MVP)

---

### Alternative 3: Minimal (Vercel + Console Logs)

**Avantages** : Gratuit, ultra-simple

**Inconvénients** :
- **Pas de structured logs** → Impossible de query
- **Pas d'error tracking** → Hard to debug prod
- **Aucune visibilité** métier

**Rejeté car** : Production incidents = impossible à debugger

---

## Consequences

### Positive
- ✅ **Cost minimal** : $0/mois pour Phase 1-2
- ✅ **Production-ready** : Sentry = critical pour debugging
- ✅ **Structured logs** : Queryable, searchable
- ✅ **Metrics custom** : Total flexibilité
- ✅ **Upgrade path clear** : Peut migrer vers Datadog si $$$

### Negative
- ⚠️ **Multiple tools** : 3 dashboards différents (Vercel, Sentry, Better Stack)
- ⚠️ **DIY metrics** : Pas de dashboard fancy (mais API endpoint suffit)
- ⚠️ **Limited retention** : Better Stack FREE = 3 jours

### Neutral
- 🔄 **Learning curve** : Équipe doit connaître 3 outils
- 🔄 **Manual correlation** : Pas automatique entre error + logs + metrics

---

## Implementation Notes

### 1. Environment Variables

```bash
# .env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
LOGTAIL_TOKEN=xxx
```

### 2. Sentry Source Maps

```bash
# next.config.ts
import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "orylo",
    project: "orylo-v3",
  },
  {
    uploadLegacySourcemaps: false,
    widenClientFileUpload: true,
    hideSourceMaps: true,
  }
);
```

### 3. Monitoring Dashboard (Simple)

```typescript
// app/admin/dashboard/page.tsx
export default async function AdminDashboard() {
  const metrics = await fetch('/api/admin/metrics').then(r => r.json());
  
  return (
    <div>
      <h1>System Metrics</h1>
      
      <Card>
        <CardHeader>Fraud Detections (24h)</CardHeader>
        <CardContent>
          <div>Total: {metrics.counters['fraud.detections.total']}</div>
          <div>Blocked: {metrics.counters['fraud.detections.block']}</div>
          <div>Reviewed: {metrics.counters['fraud.detections.review']}</div>
          <div>Allowed: {metrics.counters['fraud.detections.allow']}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>Performance</CardHeader>
        <CardContent>
          <div>Avg Latency: {metrics.histograms['fraud.detection.latency_ms'].avg}ms</div>
          <div>P95 Latency: {metrics.histograms['fraud.detection.latency_ms'].p95}ms</div>
          <div>Cache Hit Rate: {(metrics.gauges['cache.hit_rate'] * 100).toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Cost Analysis & Upgrade Path

```
PHASE 1 (0-100 marchands):
├─ Vercel Analytics: $0 (included)
├─ Sentry: $0 (< 5K errors/mois)
├─ Better Stack: $0 (< 1GB logs/mois)
├─ DIY Metrics: $0
└─ Total: $0/mois ✅

PHASE 2 (100-500 marchands):
├─ Vercel Analytics: $0
├─ Sentry: $0 (still < 5K errors/mois with good code)
├─ Better Stack: $10/mois (upgrade to 50GB)
├─ DIY Metrics: $0
└─ Total: $10/mois ✅

PHASE 3 (500-1000 marchands):
├─ Vercel Analytics: $0
├─ Sentry Pro: $29/mois (50K errors)
├─ Better Stack: $20/mois (100GB)
├─ Consider Datadog: $200-500/mois
└─ Total: $49/mois or migrate to Datadog
```

---

## Related Decisions
- ADR-001: Deployment (Vercel Analytics integrated)
- ADR-006: Background Jobs (Trigger.dev has built-in monitoring)
- ADR-010: Security (Sentry scrubs PII)

---

## Review Schedule
- **2 semaines**: Vérifier volume réel (errors, logs) vs FREE tiers
- **1 mois**: Décider si upgrade Better Stack nécessaire
- **3 mois**: Analyser si multi-dashboard est problématique (consider unified)
- **6 mois**: Revoir si migration Datadog justifiée
