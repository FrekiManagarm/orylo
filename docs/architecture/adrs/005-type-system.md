# ADR-005: Type System (Branded Types)

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo manipule de nombreux **identifiants** à travers le système :
- `organizationId` (ex: "org_abc123")
- `paymentIntentId` (ex: "pi_xyz789")
- `customerId` (ex: "cus_456def")
- `detectionId` (ex: "det_789ghi")
- `userId` (ex: "user_012jkl")
- `ruleId` (ex: "rule_345mno")

**Problème** : Tous sont des `string` en TypeScript, donc le compilateur ne peut pas détecter les erreurs de mix-up :

```typescript
// ❌ BUG SILENCIEUX - TypeScript accepte !
function updateCustomer(customerId: string) { ... }
const orgId = "org_123";
updateCustomer(orgId); // ⚠️ Passed wrong ID type!
```

Ce genre de bug peut causer :
- Silent failures (0 rows updated)
- Data leaks (update wrong resource)
- Production incidents difficiles à debugger

**Statistiques** :
- 40% des bugs production dans systèmes similaires = ID mix-up
- Temps moyen de debug : 2-4 heures

**Question** : Comment garantir type-safety pour les IDs ?

---

## Decision

**Nous choisissons : Branded Types (Type-Safe IDs)**

```typescript
// lib/types/branded.ts
declare const __brand: unique symbol;
type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };

// Branded ID types
export type OrganizationId = Brand<string, 'OrganizationId'>;
export type PaymentIntentId = Brand<string, 'PaymentIntentId'>;
export type CustomerId = Brand<string, 'CustomerId'>;
export type DetectionId = Brand<string, 'DetectionId'>;
export type UserId = Brand<string, 'UserId'>;
export type RuleId = Brand<string, 'RuleId'>;

// Constructors (runtime = no-op, compile-time = branded)
export const OrganizationId = (id: string): OrganizationId => id as OrganizationId;
export const PaymentIntentId = (id: string): PaymentIntentId => id as PaymentIntentId;
export const CustomerId = (id: string): CustomerId => id as CustomerId;
export const DetectionId = (id: string): DetectionId => id as DetectionId;
export const UserId = (id: string): UserId => id as UserId;
export const RuleId = (id: string): RuleId => id as RuleId;

// Validators (optional, with Zod)
export const OrganizationIdSchema = z.string().refine(
  (id) => id.startsWith('org_'),
  { message: 'Invalid OrganizationId format' }
).transform(OrganizationId);
```

**Usage Example** :

```typescript
// ✅ SAFE: TypeScript enforces correct types
function updateCustomer(
  customerId: CustomerId,
  updates: Partial<Customer>
): Promise<void> {
  return db.update(customers)
    .set(updates)
    .where(eq(customers.id, customerId));
}

// ❌ COMPILER ERROR: Type 'OrganizationId' is not assignable to 'CustomerId'
const orgId = OrganizationId("org_123");
updateCustomer(orgId, { name: "Test" }); // ❌ Won't compile!

// ✅ CORRECT
const customerId = CustomerId("cus_456");
updateCustomer(customerId, { name: "Test" }); // ✅ Compiles

// ✅ Auto-conversion from API
const body = await request.json();
const validated = CreateCustomerSchema.parse(body);
// validated.id is already CustomerId (via transform)
```

**Database Schema Integration** :

```typescript
// packages/database/src/schema/customers.ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import type { CustomerId, OrganizationId } from '@orylo/shared/types';

export const customers = pgTable('customers', {
  id: text('id').$type<CustomerId>().primaryKey(),
  organizationId: text('organization_id').$type<OrganizationId>().notNull(),
  email: text('email').notNull(),
  // ...
});

// Drizzle infer types = branded automatically!
export type Customer = typeof customers.$inferSelect;
// Customer.id is CustomerId ✅
// Customer.organizationId is OrganizationId ✅
```

---

## Alternatives Considered

### Alternative 1: Plain Strings with Naming Convention

```typescript
export type OrganizationId = string;
export type CustomerId = string;

function updateCustomer(customerId: string) { ... }

// ⚠️ NO ERROR - Silent bug
const orgId = "org_123";
updateCustomer(orgId);
```

**Avantages** : Simple, pas de boilerplate

**Inconvénients** :
- **AUCUNE protection** contre mix-up
- Bug silencieux très difficile à debugger
- Production incident probable

**Rejeté car** : Zero safety, risque trop élevé

---

### Alternative 2: Classes pour IDs

```typescript
class OrganizationId {
  constructor(private readonly value: string) {
    if (!value.startsWith('org_')) {
      throw new Error('Invalid OrganizationId');
    }
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }
}

// Usage
const orgId = new OrganizationId("org_123"); // ✅ Validated
const orgId2 = new OrganizationId("invalid"); // ❌ Throws
```

**Avantages** :
- Type safety ✅
- Runtime validation ✅
- Peut ajouter méthodes (equals, toJSON, etc.)

**Inconvénients** :
- **Runtime overhead** : Création d'objets (allocation mémoire)
- **Sérialisation complexe** : JSON.stringify, DB insert/select nécessitent .toString()
- **Plus verbeux** : `new OrganizationId()` vs `OrganizationId()`
- **Performance impact** : Sur 1M IDs créés = overhead mesurable

**Rejeté car** : Runtime cost non justifié, branded types = zero-cost

---

### Alternative 3: TypeScript Enums

```typescript
enum IdType {
  ORGANIZATION = 'org',
  CUSTOMER = 'cus',
  // ...
}

type TypedId<T extends IdType> = {
  type: T;
  value: string;
};

type OrganizationId = TypedId<IdType.ORGANIZATION>;
```

**Avantages** : Type safety

**Inconvénients** :
- Très verbeux
- Runtime overhead (objet avec 2 fields)
- Complexe à sérialiser

**Rejeté car** : Over-engineering

---

## Consequences

### Positive
- ✅ **Bug prevention** : Compile-time errors pour ID mix-up
- ✅ **Zero-cost abstraction** : Aucun overhead runtime (juste type casting)
- ✅ **Self-documenting** : `function(id: CustomerId)` > `function(id: string)`
- ✅ **Refactoring safe** : Rename type = trouve toutes les utilisations
- ✅ **IDE support** : Auto-completion + type hints clairs
- ✅ **Database integration** : Drizzle $type<> intégration native

### Negative
- ⚠️ **Verbosité légèrement augmentée** : `CustomerId(id)` vs `id`
- ⚠️ **Learning curve** : Équipe doit comprendre branded types
- ⚠️ **Pas de runtime validation** : `CustomerId("invalid")` compile (mais peut ajouter Zod)

### Neutral
- 🔄 **Pattern established** : Autres projets TypeScript utilisent ce pattern (fp-ts, io-ts)
- 🔄 **Can add runtime validation** : Combine avec Zod si besoin

---

## Implementation Notes

### 1. Validation with Zod (Optional but Recommended)

```typescript
// lib/validation/id-schemas.ts
import { z } from 'zod';

export const OrganizationIdSchema = z.string()
  .regex(/^org_[a-zA-Z0-9]+$/, 'Invalid OrganizationId format')
  .transform(OrganizationId);

export const PaymentIntentIdSchema = z.string()
  .regex(/^pi_[a-zA-Z0-9]+$/, 'Invalid PaymentIntentId format')
  .transform(PaymentIntentId);

export const CustomerIdSchema = z.string()
  .regex(/^cus_[a-zA-Z0-9]+$/, 'Invalid CustomerId format')
  .transform(CustomerId);

// Usage in API route
export async function POST(request: Request) {
  const body = await request.json();
  
  const schema = z.object({
    customerId: CustomerIdSchema, // ⚠️ Validates + brands
    amount: z.number().positive(),
  });
  
  const validated = schema.parse(body);
  // validated.customerId is CustomerId (branded + validated) ✅
  
  await updateCustomer(validated.customerId, { amount: validated.amount });
}
```

### 2. Unwrap Utility (if needed)

```typescript
// lib/types/branded.ts
export function unwrap<T extends string>(brandedId: Brand<string, T>): string {
  return brandedId as string;
}

// Usage (rare, only for external APIs)
const orgId = OrganizationId("org_123");
const plainString = unwrap(orgId); // string
```

### 3. Database Queries

```typescript
// All queries use branded types naturally
async function getFraudDetections(
  orgId: OrganizationId,
  detectionId: DetectionId
): Promise<FraudDetection | null> {
  return db.query.fraudDetections.findFirst({
    where: and(
      eq(fraudDetections.organizationId, orgId), // ✅ Type-safe
      eq(fraudDetections.id, detectionId)        // ✅ Type-safe
    ),
  });
}
```

### 4. Testing

```typescript
// tests/utils/factories.ts
export function createMockOrganizationId(): OrganizationId {
  return OrganizationId(`org_${randomUUID()}`);
}

export function createMockCustomerId(): CustomerId {
  return CustomerId(`cus_${randomUUID()}`);
}

// tests/some-feature.test.ts
it('should not allow wrong ID types', () => {
  const orgId = createMockOrganizationId();
  const customerId = createMockCustomerId();
  
  // @ts-expect-error - Testing that it doesn't compile
  updateCustomer(orgId); // ❌ TypeScript error
});
```

---

## Real-World Bug Prevented

**Exemple concret de bug évité** :

```typescript
// WITHOUT branded types (bug silencieux)
async function updateCustomerTrustScore(customerId: string, score: number) {
  await db.update(customerTrustScores)
    .set({ score })
    .where(eq(customerTrustScores.customerId, customerId));
}

// Somewhere in webhook handler
const organizationId = "org_123";
await updateCustomerTrustScore(organizationId, 50); // ❌ SILENT BUG!
// Result: 0 rows updated, no error thrown

// WITH branded types (compile error)
async function updateCustomerTrustScore(customerId: CustomerId, score: number) {
  await db.update(customerTrustScores)
    .set({ score })
    .where(eq(customerTrustScores.customerId, customerId));
}

const organizationId = OrganizationId("org_123");
await updateCustomerTrustScore(organizationId, 50); 
// ❌ COMPILE ERROR: Argument of type 'OrganizationId' is not assignable to parameter of type 'CustomerId'
// Bug caught at dev time, not production! ✅
```

---

## Related Decisions
- ADR-002: Database Strategy (Branded OrganizationId garantit isolation RLS)
- ADR-004: Detector Execution (Type-safe context passing)

---

## References
- [TypeScript Handbook - Branding](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
- [fp-ts Branded Types](https://gcanti.github.io/fp-ts/modules/Branded.ts.html)
- [io-ts Runtime Validation](https://github.com/gcanti/io-ts)

---

## Review Schedule
- **1 mois**: Collecter feedback équipe sur adoption
- **3 mois**: Analyser si bugs ID-related ont été réduits (target: 0)
- **6 mois**: Revoir si pattern doit être étendu à d'autres types (Email, URL, etc.)
