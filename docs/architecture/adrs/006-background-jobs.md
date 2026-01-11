# ADR-006: Background Jobs Architecture

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo nécessite **jobs asynchrones** pour :

**Event-Driven Jobs** :
- ✅ **AI Explanation Generation** (2-5s, non-urgent, peut retry)
- ✅ **Email Alerts** (urgent si BLOCK, doit être rapide)
- ✅ **Webhook Retries** (si échec initial, retry avec backoff)

**Scheduled Jobs** :
- ✅ **Daily Reports** (chaque jour à 9h)
- ✅ **Weekly Cleanup** (vieux logs, data retention)
- ✅ **Health Checks** (toutes les 15 min)

**Contraintes** :
- Architecture serverless (Vercel) = pas de worker long-running
- Webhook response DOIT être < 2s (Stripe timeout)
- AI generation = 2-5s → DOIT être async (non-bloquant)
- Budget initial limité (~$0-20/mois)

**Volume estimé** :
- Phase 1 (0-100 marchands) : ~10K jobs/mois
- Phase 2 (100-500 marchands) : ~100K jobs/mois
- Phase 3 (500+ marchands) : ~500K+ jobs/mois

---

## Decision

**Nous choisissons : Trigger.dev (All Jobs - Event-Driven + Scheduled)**

```typescript
BACKGROUND JOBS: Trigger.dev v4
├─ Event-driven jobs:
│   ├─ AI Explanation (priority: HIGH for BLOCK, NORMAL for ALLOW)
│   ├─ Email Alerts (priority: URGENT)
│   └─ Webhook Retries (retry: 3 attempts, exponential backoff)
│
├─ Scheduled jobs (cron):
│   ├─ Daily Reports (cron: "0 9 * * *")
│   ├─ Weekly Cleanup (cron: "0 2 * * 0")
│   └─ Health Checks (cron: "*/15 * * * *")
│
├─ Dashboard: cloud.trigger.dev
├─ Deployment: Vercel (same repo)
└─ Cost: $0 (free 100K runs) → $20/mois (500K runs)
```

**Implementation Example** :

```typescript
// trigger/jobs/ai-explanation.job.ts
import { task } from "@trigger.dev/sdk/v3";
import { openai } from "@/lib/openai";
import { db } from "@orylo/database";

export const generateAIExplanation = task({
  id: "generate-ai-explanation",
  
  // Retry config
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 10000,
  },
  
  // Priority queue
  queue: {
    name: "ai-explanation",
    concurrencyLimit: 10,
  },
  
  run: async (payload: {
    detectionId: DetectionId;
    context: TransactionContext;
    factors: FraudFactor[];
    priority: 'HIGH' | 'NORMAL';
  }) => {
    // 1. Build prompt
    const prompt = buildExplanationPrompt(
      payload.context,
      payload.factors
    );
    
    // 2. Call OpenAI (can take 2-5s)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en détection de fraude...",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      language: "fr",
    });
    
    const explanation = completion.choices[0].message.content;
    
    // 3. Update DB avec explanation
    await db.update(fraudDetections)
      .set({
        aiExplanation: explanation,
        aiGeneratedAt: new Date(),
      })
      .where(eq(fraudDetections.id, payload.detectionId));
    
    return { success: true, explanation };
  },
});

// Usage dans webhook handler (non-bloquant)
await generateAIExplanation.trigger({
  detectionId,
  context,
  factors,
  priority: decision === 'BLOCK' ? 'HIGH' : 'NORMAL',
});
// Webhook répond immédiatement (< 250ms)
// AI process en background (2-5s)
```

**Scheduled Job Example** :

```typescript
// trigger/jobs/scheduled/daily-report.job.ts
import { schedules } from "@trigger.dev/sdk/v3";

export const dailyReport = schedules.task({
  id: "daily-report",
  cron: "0 9 * * *", // Every day at 9am UTC
  
  run: async (payload) => {
    // 1. Fetch yesterday's stats
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await db.query.fraudDetections.findMany({
      where: gte(fraudDetections.createdAt, yesterday),
    });
    
    // 2. Aggregate metrics
    const report = {
      totalDetections: stats.length,
      blocked: stats.filter(d => d.decision === 'BLOCK').length,
      reviewed: stats.filter(d => d.decision === 'REVIEW').length,
      allowed: stats.filter(d => d.decision === 'ALLOW').length,
    };
    
    // 3. Send email to all admins
    await sendDailyReportEmail(report);
    
    return { success: true, report };
  },
});
```

---

## Alternatives Considered

### Alternative 1: Hybrid (Trigger.dev + Vercel Cron)

```typescript
// Trigger.dev pour event-driven
// Vercel Cron pour scheduled

// vercel.json
{
  "crons": [{
    "path": "/api/cron/daily-report",
    "schedule": "0 9 * * *"
  }]
}
```

**Avantages** :
- Vercel Cron = gratuit (included)
- Simple pour scheduled jobs

**Inconvénients** :
- **2 systèmes différents** : Trigger.dev + Vercel Cron
- **Monitoring fragmenté** : 2 dashboards
- **Retry logic différente** : Vercel Cron = pas de retry automatique
- **Less cohérent**

**Rejeté car** : Préférence pour cohérence, Trigger.dev peut tout faire

---

### Alternative 2: BullMQ + Redis

```typescript
import { Queue, Worker } from "bullmq";

const aiQueue = new Queue("ai-explanation", { 
  connection: redis 
});

// Worker (needs to run 24/7 somewhere!)
const worker = new Worker("ai-explanation", async (job) => {
  // Process...
}, { connection: redis });

// Usage
await aiQueue.add("generate", payload);
```

**Avantages** :
- Plus de contrôle
- Pas de vendor lock-in
- Battle-tested

**Inconvénients** :
- **Besoin d'un worker running 24/7** ⚠️ (pas serverless!)
- **DevOps overhead** : Monitoring, scaling, deploys worker
- **Redis charge supplémentaire**
- **Pas de dashboard out-of-the-box**
- **Complexité setup** : Worker deploy séparé

**Rejeté car** : Pas serverless-friendly, trop de DevOps pour MVP

---

### Alternative 3: Inngest (Similaire à Trigger.dev)

```typescript
import { inngest } from "./client";

export const generateAIExplanation = inngest.createFunction(
  { id: "generate-ai-explanation" },
  { event: "fraud/ai-explanation-requested" },
  async ({ event }) => {
    // Process...
  }
);
```

**Avantages** :
- Très similaire à Trigger.dev
- Step functions (observabilité granulaire)
- Open source SDK

**Inconvénients** :
- Plus récent que Trigger.dev
- Moins mature
- Pricing similaire
- Légèrement plus complexe

**Rejeté car** : Trigger.dev plus mature, documentation meilleure

---

## Consequences

### Positive
- ✅ **Serverless-native** : Pas de serveur à gérer
- ✅ **Dashboard unifié** : Tous les jobs dans cloud.trigger.dev
- ✅ **Retry automatique** : Avec exponential backoff (configurable)
- ✅ **Priority queues** : HIGH pour BLOCK, NORMAL pour ALLOW
- ✅ **Vercel-friendly** : Deploy avec `vercel deploy` (même repo)
- ✅ **Monitoring** : Logs, replay, metrics built-in
- ✅ **Cost-effective** : $0 pour 100K runs, $20 pour 500K
- ✅ **Type-safe** : TypeScript first-class support
- ✅ **Scheduled + Event-driven** : Tout dans un seul système

### Negative
- ⚠️ **Vendor lock-in Trigger.dev** : Migration vers autre système = réécriture
- ⚠️ **Relativement nouveau** : Trigger.dev v4 sorti en 2025
- ⚠️ **Cold starts possibles** : Première exécution peut être lente (~500ms)

### Neutral
- 🔄 **Learning curve** : Équipe doit apprendre Trigger.dev API
- 🔄 **Dépendance externe** : Si Trigger.dev down = jobs pausés (mais SLA 99.9%)

---

## Implementation Notes

### 1. Setup Trigger.dev

```bash
# Install SDK
bun add @trigger.dev/sdk

# Init Trigger.dev
bunx trigger.dev@latest init

# Configure env vars
# .env
TRIGGER_SECRET_KEY=tr_dev_...
TRIGGER_API_URL=https://api.trigger.dev
```

### 2. Project Structure

```
trigger/
├── jobs/
│   ├── ai-explanation.job.ts
│   ├── email-alerts.job.ts
│   ├── webhook-retry.job.ts
│   └── scheduled/
│       ├── daily-report.job.ts
│       ├── weekly-cleanup.job.ts
│       └── health-check.job.ts
├── client.ts
└── index.ts
```

### 3. Trigger from Webhook

```typescript
// app/api/webhooks/stripe/[accountId]/route.ts
import { generateAIExplanation } from "@/trigger/jobs/ai-explanation.job";

export async function POST(request: Request) {
  // 1. Process webhook
  const fraudResult = await fraudEngine.detect(context);
  
  // 2. Save to DB (without AI explanation)
  const detection = await db.insert(fraudDetections).values({
    organizationId,
    decision: fraudResult.decision,
    riskScore: fraudResult.riskScore,
    factors: fraudResult.factors,
    aiExplanation: null, // ⚠️ Will be generated async
  });
  
  // 3. Trigger AI job (non-blocking)
  await generateAIExplanation.trigger({
    detectionId: detection.id,
    context,
    factors: fraudResult.factors,
    priority: fraudResult.decision === 'BLOCK' ? 'HIGH' : 'NORMAL',
  });
  
  // 4. Take action (block, email, etc.)
  if (fraudResult.decision === 'BLOCK') {
    await stripe.paymentIntents.cancel(paymentIntentId);
    await sendAlertEmail(organizationId, detection);
  }
  
  // 5. Return immediately (< 250ms total)
  return Response.json({ received: true });
}
```

### 4. Monitoring Dashboard

Access at: `https://cloud.trigger.dev`

**Metrics available** :
- Jobs executed (success/failure)
- Average duration
- Retry attempts
- Queue depth
- Error rate
- Logs & stack traces

### 5. Local Development

```bash
# Run Trigger.dev dev server
bunx trigger.dev@latest dev

# Webhook will trigger jobs locally
# See logs in terminal
```

---

## Cost Analysis

**Trigger.dev Pricing** :
- **Free Tier** : 100,000 runs/month
- **Pro** : $20/month for 500,000 runs
- **Scale** : $100/month for 2,500,000 runs

**Orylo Usage Estimation** :

```
Phase 1 (0-100 marchands):
├─ AI explanations: ~5K/mois
├─ Email alerts: ~500/mois
├─ Scheduled jobs: ~4K/mois (daily + health checks)
└─ Total: ~10K/mois = FREE ✅

Phase 2 (100-500 marchands):
├─ AI explanations: ~50K/mois
├─ Email alerts: ~5K/mois
├─ Scheduled jobs: ~4K/mois
└─ Total: ~60K/mois = FREE ✅

Phase 3 (500-1000 marchands):
├─ AI explanations: ~200K/mois
├─ Email alerts: ~20K/mois
├─ Scheduled jobs: ~4K/mois
└─ Total: ~225K/mois = $20/mois ✅
```

**ROI** : $20/mois vs gérer un worker + monitoring = worth it

---

## Related Decisions
- ADR-001: Deployment (Serverless = besoin de background jobs serverless)
- ADR-003: Cache (Jobs peuvent invalider cache après updates)

---

## Review Schedule
- **1 mois**: Vérifier coûts réels vs estimations
- **3 mois**: Analyser job success rate (target: >99%)
- **6 mois**: Revoir si alternative (Inngest, BullMQ) justifiée si croissance massive
