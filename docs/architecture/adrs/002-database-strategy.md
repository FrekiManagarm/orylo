# ADR-002: Database Strategy

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo V3 est une plateforme multi-tenant SaaS où :
- Chaque organization a ses propres données (fraud detections, customers, rules)
- Les données doivent être **strictement isolées** (RGPD, sécurité)
- Risque de data leak = catastrophique (production incident + legal issues)

Entités principales :
- Organizations (~500-1000 pour scale)
- Users & Auth
- Fraud Detections (~10K-100K par org/mois)
- Customers & Trust Scores (~1K-10K par org)
- Custom Rules (~10-100 par org)
- Whitelist/Blacklist (~100-1000 items par org)

---

## Decision

**Nous choisissons : Single PostgreSQL Database with Row Level Security (RLS)**

```sql
-- Toutes les tables ont organization_id
CREATE TABLE fraud_detections (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payment_intent_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fraud_detections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their org's data
CREATE POLICY org_isolation ON fraud_detections
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

**Helper Function pour toutes les queries**:
```typescript
// lib/db/with-org-context.ts
export async function withOrgContext<T>(
  organizationId: OrganizationId,
  query: () => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set PostgreSQL session variable
    await tx.execute(
      sql`SET LOCAL app.current_org_id = ${organizationId}`
    );
    return query();
  });
}

// Usage (MANDATORY for all queries)
const detections = await withOrgContext(orgId, async () => {
  return db.query.fraudDetections.findMany();
});
```

---

## Alternatives Considered

### Alternative 1: App-Level Isolation (No RLS)
```typescript
// Isolation dans le code uniquement
async function getFraudDetections(organizationId: string) {
  return db.query.fraudDetections.findMany({
    where: eq(fraudDetections.organizationId, organizationId)
  });
}
```

- **Avantages**: Plus flexible, pas de contraintes PostgreSQL
- **Inconvénients**: **Sécurité dépend 100% du code** (si développeur oublie le filter = data leak silencieux)
- **Rejeté car**: Risque humain trop élevé, pas de safety net au niveau DB

### Alternative 2: Database per Organization
```
Organization A → orylo_org_a (DB)
Organization B → orylo_org_b (DB)
Organization C → orylo_org_c (DB)
```

- **Avantages**: Isolation TOTALE (physique), peut offrir "dedicated DB" en Premium tier
- **Inconvénients**: Complexité énorme (migrations sur 1000 DBs, backups, monitoring), impossible analytics cross-org
- **Rejeté car**: Overkill pour MVP, ne scale pas opérationnellement

---

## Consequences

### Positive
- ✅ **Sécurité au niveau DB**: Même si code oublie filter, RLS protège
- ✅ **Audit trail**: PostgreSQL logs montrent quel org accède à quoi
- ✅ **Simple**: Une seule DB à gérer (migrations, backups)
- ✅ **Cross-org analytics possible**: Pour metrics globales (anonymisées)
- ✅ **Fail-safe**: Double protection (RLS + app-level checks)
- ✅ **RGPD-friendly**: Isolation garantie au niveau infrastructure

### Negative
- ⚠️ **Performance overhead léger**: SET session variable à chaque transaction (~1ms)
- ⚠️ **Verbosité**: Toutes les queries doivent passer par `withOrgContext()`
- ⚠️ **PostgreSQL-specific**: RLS pas disponible sur toutes les DBs (mais on utilise PostgreSQL)

### Neutral
- 🔄 **Learning curve**: Équipe doit comprendre RLS
- 🔄 **Testing**: Doit tester que RLS fonctionne correctement

---

## Implementation Notes

### 1. Schema Drizzle avec organization_id OBLIGATOIRE

```typescript
// packages/database/src/schema/fraud-detections.ts
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const fraudDetections = pgTable('fraud_detections', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id), // ⚠️ FOREIGN KEY
  paymentIntentId: text('payment_intent_id').notNull(),
  decision: text('decision', { enum: ['ALLOW', 'REVIEW', 'BLOCK'] }).notNull(),
  riskScore: integer('risk_score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 2. Migration pour enable RLS

```sql
-- drizzle/migrations/0001_enable_rls.sql
ALTER TABLE fraud_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_fraud_detections ON fraud_detections
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);

-- Répéter pour toutes les tables multi-tenant
ALTER TABLE customer_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation_customer_trust_scores ON customer_trust_scores
  USING (organization_id = current_setting('app.current_org_id', true)::uuid);

-- ... etc
```

### 3. Tests pour vérifier isolation

```typescript
// packages/database/tests/rls.test.ts
describe('RLS Isolation', () => {
  it('should only return data for current org', async () => {
    // Setup: Create data for 2 orgs
    const orgA = await createOrg();
    const orgB = await createOrg();
    
    await createDetection({ organizationId: orgA.id });
    await createDetection({ organizationId: orgB.id });
    
    // Test: Query with orgA context
    const detectionsA = await withOrgContext(orgA.id, async () => {
      return db.query.fraudDetections.findMany();
    });
    
    // Assert: Only orgA data returned
    expect(detectionsA).toHaveLength(1);
    expect(detectionsA[0].organizationId).toBe(orgA.id);
  });
});
```

---

## Security Considerations

1. **Session variable scoping**: Utiliser `SET LOCAL` (pas `SET`) pour limiter au scope transaction
2. **Fallback safe**: `current_setting('app.current_org_id', true)` avec `true` = return NULL si pas set (vs error)
3. **Backup strategy**: Backups incluent toutes les orgs, restore sélectif possible via `WHERE organization_id`

---

## Related Decisions
- ADR-005: Type System (OrganizationId branded type pour type-safety)
- ADR-010: Security Architecture (RLS = Layer 3 de defense)

---

## Review Schedule
- **1 mois**: Vérifier performance overhead (doit être < 1ms)
- **3 mois**: Analyser logs pour tentatives d'accès cross-org (doit être 0)
- **6 mois**: Revoir si scale à 1000+ orgs sans problème
