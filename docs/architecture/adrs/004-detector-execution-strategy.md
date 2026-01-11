# ADR-004: Detector Execution Strategy

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Le Fraud Detection Engine analyse chaque transaction via **6 detectors** :
1. **BlacklistDetector** (Priority: 1000 - CRITICAL)
2. **CardTestingDetector** (Priority: 900 - CRITICAL)
3. **TrustScoreDetector** (Priority: 800 - HIGH)
4. **GeographicDetector** (Priority: 700 - HIGH)
5. **VelocityDetector** (Priority: 600 - HIGH)
6. **AmountDetector** (Priority: 500 - MEDIUM)

**Questions clés** :
- Dans quel **ordre** exécuter les detectors ?
- En **séquentiel** ou **parallèle** ?
- Peut-on **arrêter early** si décision certaine (ex: blacklist = BLOCK instantané) ?

**Performance target** : < 250ms P95 pour tout le pipeline de détection

**Distribution des cas estimée** :
- 10% : Blacklist hit (décision certaine immédiate)
- 20% : Early exit possible (VIP whitelist, score extrême)
- 70% : Full pipeline requis (analyse complète)

---

## Decision

**Nous choisissons : Sequential Execution with Priority + Early Exit**

```typescript
class FraudDetectionEngine {
  private detectors: IDetector[] = [
    new BlacklistDetector(),        // Priority: 1000
    new CardTestingDetector(),      // Priority: 900
    new TrustScoreDetector(),       // Priority: 800
    new GeographicDetector(),       // Priority: 700
    new VelocityDetector(),         // Priority: 600
    new AmountDetector(),           // Priority: 500
  ];

  async detect(context: TransactionContext): Promise<FraudResult> {
    const factors: FraudFactor[] = [];
    
    // Sort by priority (highest first)
    const sortedDetectors = this.detectors.sort((a, b) => 
      b.priority - a.priority
    );
    
    for (const detector of sortedDetectors) {
      if (!detector.canHandle(context)) continue;
      
      const result = await detector.detect(context);
      factors.push(...result.factors);
      
      // 🔥 EARLY EXIT CONDITIONS
      
      // Blacklist = BLOCK immédiat
      if (result.certainDecision === 'BLOCK') {
        return {
          decision: 'BLOCK',
          riskScore: 100,
          factors,
          stoppedAt: detector.name,
          earlyExit: true,
        };
      }
      
      // VIP + low score = ALLOW immédiat
      if (result.certainDecision === 'ALLOW' && 
          context.customer.tier === 'vip') {
        return {
          decision: 'ALLOW',
          riskScore: 0,
          factors,
          stoppedAt: detector.name,
          earlyExit: true,
        };
      }
    }
    
    // Full pipeline : calcul score final
    const riskScore = this.scoringStrategy.aggregate(factors);
    const decision = this.makeDecision(riskScore);
    
    return { decision, riskScore, factors, earlyExit: false };
  }
  
  private makeDecision(riskScore: number): Decision {
    if (riskScore >= 70) return 'BLOCK';
    if (riskScore >= 30) return 'REVIEW';
    return 'ALLOW';
  }
}
```

**Priority Rationale** :
- **Blacklist FIRST** : Si blacklisté, pas besoin d'analyser quoi que ce soit (économie CPU + latency)
- **Card Testing SECOND** : Pattern critique, souvent décisif
- **Trust Score THIRD** : VIP clients peuvent bypass détection plus loin
- **Autres detectors** : Par ordre d'importance décroissante

---

## Alternatives Considered

### Alternative 1: Parallel Execution (All Detectors at Once)

```typescript
async detect(context: TransactionContext): Promise<FraudResult> {
  // Tous les detectors s'exécutent EN PARALLÈLE
  const results = await Promise.all(
    this.detectors
      .filter(d => d.canHandle(context))
      .map(d => d.detect(context))
  );
  
  const factors = results.flatMap(r => r.factors);
  const riskScore = this.scoringStrategy.aggregate(factors);
  
  return { decision: this.makeDecision(riskScore), riskScore, factors };
}
```

**Performance** :
- Tous les cas : ~40ms (temps du plus lent detector)
- Ultra-rapide, maximum throughput

**Inconvénients** :
- **TOUJOURS run les 6 detectors** même si blacklisté (gaspillage)
- Early exit impossible
- Plus de load DB/CPU pour rien (10% des cas)
- Coûts légèrement plus élevés

**Rejeté car** : Optimisation prématurée, gaspille ressources pour cas évidents

---

### Alternative 2: Hybrid (Critical Sequential, Others Parallel)

```typescript
async detect(context: TransactionContext): Promise<FraudResult> {
  const factors: FraudFactor[] = [];
  
  // Phase 1: CRITICAL detectors (sequential + early exit)
  const criticalDetectors = [
    this.blacklistDetector,
    this.cardTestingDetector,
  ];
  
  for (const detector of criticalDetectors) {
    const result = await detector.detect(context);
    factors.push(...result.factors);
    
    if (result.certainDecision) {
      return { decision: result.certainDecision, factors };
    }
  }
  
  // Phase 2: Autres detectors (parallel)
  const otherDetectors = [
    this.trustScoreDetector,
    this.geographicDetector,
    this.velocityDetector,
    this.amountDetector,
  ];
  
  const parallelResults = await Promise.all(
    otherDetectors.map(d => d.detect(context))
  );
  
  factors.push(...parallelResults.flatMap(r => r.factors));
  
  const riskScore = this.scoringStrategy.aggregate(factors);
  return { decision: this.makeDecision(riskScore), riskScore, factors };
}
```

**Performance** :
- Blacklist hit : ~2ms (early exit)
- Full pipeline : ~50ms (parallel après phase 1)

**Avantages** : Meilleur des deux mondes

**Inconvénients** :
- Plus complexe (2 phases)
- Difficile à tester
- Order-dependent behavior dans phase 2 (non-déterministe)

**Rejeté car** : Over-engineering pour MVP, complexité pas justifiée

---

## Consequences

### Positive
- ✅ **Simple**: Code lisible, logique claire
- ✅ **Efficient pour cas communs**: Blacklist hit = 2ms (10% des cas)
- ✅ **Predictable**: Déterministe, toujours même ordre
- ✅ **Testable**: Facile de mock et tester chaque detector isolément
- ✅ **Early exit = cost savings**: Pas de gaspillage CPU/DB pour cas évidents
- ✅ **Performance acceptable**: 90ms full pipeline (dans budget 250ms)

### Negative
- ⚠️ **Latency séquentielle**: 6 detectors × 15ms avg = ~90ms (vs 40ms parallel)
- ⚠️ **Pas optimal throughput**: Si besoin de >10K req/s, parallel serait mieux

### Neutral
- 🔄 **Optimisation future possible**: Peut migrer vers hybrid si profiling montre bottleneck
- 🔄 **Order matters**: Changement d'ordre = changement de comportement (mais ça peut être voulu)

---

## Implementation Notes

### 1. Interface IDetector

```typescript
// packages/fraud-engine/src/core/interfaces.ts
export interface IDetector {
  name: string;
  priority: number; // Higher = execute first
  
  canHandle(context: TransactionContext): boolean;
  
  detect(context: TransactionContext): Promise<DetectionResult>;
}

export interface DetectionResult {
  factors: FraudFactor[];
  certainDecision?: 'ALLOW' | 'BLOCK'; // Si présent = early exit
}
```

### 2. Example Detector Implementation

```typescript
// packages/fraud-engine/src/detectors/blacklist.detector.ts
export class BlacklistDetector implements IDetector {
  name = 'BlacklistDetector';
  priority = 1000; // HIGHEST
  
  canHandle(context: TransactionContext): boolean {
    return true; // Always run
  }
  
  async detect(context: TransactionContext): Promise<DetectionResult> {
    // Check cache first (L1 + L2)
    const isBlacklisted = await cache.get(`blacklist:${context.customer.email}`);
    
    if (isBlacklisted) {
      return {
        factors: [{
          type: 'BLACKLISTED_CUSTOMER',
          weight: 100,
          severity: 'CRITICAL',
          description: `Customer ${context.customer.email} is blacklisted`,
        }],
        certainDecision: 'BLOCK', // ⚠️ EARLY EXIT
      };
    }
    
    return { factors: [] };
  }
}
```

### 3. Tests

```typescript
// packages/fraud-engine/tests/engine.test.ts
describe('FraudDetectionEngine', () => {
  it('should early exit on blacklist hit', async () => {
    const context = mockContext({
      customer: { email: 'fraudster@evil.com' },
    });
    
    // Add to blacklist
    await addToBlacklist('fraudster@evil.com');
    
    const result = await engine.detect(context);
    
    expect(result.decision).toBe('BLOCK');
    expect(result.riskScore).toBe(100);
    expect(result.earlyExit).toBe(true);
    expect(result.stoppedAt).toBe('BlacklistDetector');
    
    // Should not have run other detectors
    expect(result.factors).toHaveLength(1);
  });
  
  it('should run full pipeline when no early exit', async () => {
    const context = mockContext({
      customer: { email: 'normal@user.com', tier: 'new' },
      amount: 5000, // Medium amount
      ipCountry: 'FR',
      cardCountry: 'US', // Geographic mismatch
    });
    
    const result = await engine.detect(context);
    
    expect(result.earlyExit).toBe(false);
    expect(result.factors.length).toBeGreaterThan(1);
    // Multiple detectors contributed
  });
});
```

---

## Performance Benchmarks

**Measured on M1 MacBook Pro (dev environment)** :

```
Scenario                    | Latency | Early Exit | Detectors Run
----------------------------|---------|------------|--------------
Blacklist hit               | 2ms     | ✅ Yes     | 1/6
VIP whitelist               | 15ms    | ✅ Yes     | 3/6
Card testing detected       | 35ms    | ✅ Yes     | 2/6
Low-risk transaction        | 85ms    | ❌ No      | 6/6
Medium-risk transaction     | 90ms    | ❌ No      | 6/6
High-risk transaction       | 92ms    | ❌ No      | 6/6
```

**Weighted average (distribution réaliste)** :
```
10% blacklist (2ms) + 20% early exit (25ms) + 70% full (90ms)
= 0.1×2 + 0.2×25 + 0.7×90
= 0.2 + 5 + 63
= 68ms average ✅
```

**P95 latency** : ~90ms (acceptable dans budget 250ms)

---

## Related Decisions
- ADR-003: Cache Architecture (Cache L1 permet blacklist check en < 1ms)
- ADR-005: Type System (Branded types pour garantir correct context)

---

## Review Schedule
- **1 mois**: Analyser distribution réelle des early exits
- **3 mois**: Profiler latency par detector, identifier bottlenecks
- **6 mois**: Revoir si migration vers hybrid ou parallel justifiée
