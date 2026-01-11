# ADR-007: API Architecture Pattern

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo V3 expose plusieurs types d'endpoints API :

**1. Public Webhooks** (pas d'auth Better Auth):
- `/api/webhooks/stripe/[accountId]` - Reçoit events Stripe
- Auth: Signature Stripe seulement

**2. Protected API** (auth Better Auth requise):
- `/api/v1/detections` - CRUD fraud detections
- `/api/v1/customers` - CRUD customers
- `/api/v1/rules` - CRUD custom rules
- `/api/v1/settings` - Organization settings
- `/api/v1/events` - SSE pour real-time

**3. Admin API** (admin role requis):
- `/api/admin/organizations` - Gestion orgs
- `/api/admin/health` - Health checks
- `/api/admin/metrics` - System metrics

**Besoins** :
- Structure claire et scalable
- Versioning support (`/v1`, `/v2`)
- Auth granulaire par type d'endpoint
- RESTful conventions
- Type-safe (TypeScript)

**Volume estimé** :
- Webhooks: 1K-10K req/jour
- Protected API: 10K-100K req/jour
- Admin API: 100-1K req/jour

---

## Decision

**Nous choisissons : Route Groups par Type (RESTful)**

```
app/api/
├── webhooks/                         # Public (Stripe signature)
│   └── stripe/
│       └── [accountId]/
│           └── route.ts              # POST /api/webhooks/stripe/:accountId
│
├── v1/                               # Protected (Better Auth)
│   ├── detections/
│   │   ├── route.ts                  # GET/POST /api/v1/detections
│   │   └── [id]/
│   │       ├── route.ts              # GET/PATCH /api/v1/detections/:id
│   │       └── review/
│   │           └── route.ts          # POST /api/v1/detections/:id/review
│   │
│   ├── customers/
│   │   ├── route.ts                  # GET/POST /api/v1/customers
│   │   └── [id]/
│   │       ├── route.ts              # GET/PATCH/DELETE /api/v1/customers/:id
│   │       ├── whitelist/
│   │       │   └── route.ts          # POST /api/v1/customers/:id/whitelist
│   │       ├── blacklist/
│   │       │   └── route.ts          # POST /api/v1/customers/:id/blacklist
│   │       └── transactions/
│   │           └── route.ts          # GET /api/v1/customers/:id/transactions
│   │
│   ├── rules/
│   │   ├── route.ts                  # GET/POST /api/v1/rules
│   │   └── [id]/
│   │       └── route.ts              # GET/PATCH/DELETE /api/v1/rules/:id
│   │
│   ├── settings/
│   │   └── route.ts                  # GET/PATCH /api/v1/settings
│   │
│   └── events/
│       └── route.ts                  # GET /api/v1/events (SSE)
│
└── admin/                            # Admin only
    ├── organizations/
    │   └── route.ts                  # GET /api/admin/organizations
    ├── health/
    │   └── route.ts                  # GET /api/admin/health
    ├── metrics/
    │   └── route.ts                  # GET /api/admin/metrics
    └── cache/
        ├── metrics/
        │   └── route.ts              # GET /api/admin/cache/metrics
        └── invalidate/
            └── route.ts              # POST /api/admin/cache/invalidate
```

**Example Implementation** :

```typescript
// app/api/v1/detections/route.ts
import { auth } from "@/lib/auth";
import { withOrgContext } from "@orylo/database";
import { z } from "zod";

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  decision: z.enum(['ALLOW', 'REVIEW', 'BLOCK']).optional(),
});

export async function GET(request: Request) {
  // 1. Authentication
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const organizationId = OrganizationId(
    session.session.activeOrganizationId
  );
  
  // 2. Parse & validate query params
  const { searchParams } = new URL(request.url);
  const query = QuerySchema.parse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
    decision: searchParams.get("decision"),
  });
  
  // 3. Fetch data with RLS context
  const detections = await withOrgContext(organizationId, async () => {
    return db.query.fraudDetections.findMany({
      where: query.decision 
        ? eq(fraudDetections.decision, query.decision)
        : undefined,
      limit: query.limit,
      offset: query.offset,
      orderBy: desc(fraudDetections.createdAt),
    });
  });
  
  // 4. Response
  return Response.json({
    data: detections,
    pagination: {
      limit: query.limit,
      offset: query.offset,
      total: detections.length,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Implementation...
}
```

**Admin Middleware Example** :

```typescript
// lib/middleware/require-admin.ts
export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session) {
    throw new UnauthorizedException();
  }
  
  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.organizationId, session.session.activeOrganizationId)
    ),
  });
  
  if (!membership || membership.role !== 'owner') {
    throw new ForbiddenException('Admin access required');
  }
  
  return session;
}

// app/api/admin/metrics/route.ts
export async function GET(request: Request) {
  await requireAdmin(request);
  
  // Only admins reach here
  const metrics = await getSystemMetrics();
  return Response.json(metrics);
}
```

---

## Alternatives Considered

### Alternative 1: tRPC (Type-Safe API)

```typescript
// server/routers/detections.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const detectionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      return db.query.fraudDetections.findMany({
        limit: input.limit,
        offset: input.offset,
      });
    }),
    
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ...
    }),
});

// Client usage (100% type-safe!)
const detections = await trpc.detections.list.query({ limit: 20 });
//    ^? FraudDetection[]
```

**Avantages** :
- Type-safety end-to-end (frontend ↔ backend)
- Auto-completion IDE
- Input validation automatic (Zod)
- DevEx incroyable

**Inconvénients** :
- **Plus complexe** pour MVP
- **Learning curve** pour l'équipe
- **Webhooks Stripe** = doivent rester REST anyway
- **Overhead setup** : Router, procedures, middleware

**Rejeté car** : Over-engineering pour MVP, REST suffit

---

### Alternative 2: API Routes Flat (Simple)

```
app/api/
├── webhook-stripe.ts
├── detections-list.ts
├── detections-get.ts
├── customers-list.ts
├── customers-get.ts
└── ...
```

**Avantages** : Ultra-simple

**Inconvénients** :
- **Pas scalable** : 50+ routes = chaos
- **Pas de conventions**
- **Difficile à naviguer**
- **Pas de versioning**

**Rejeté car** : Ne scale pas

---

### Alternative 3: GraphQL

```typescript
// schema.graphql
type Query {
  detections(limit: Int, offset: Int): [Detection!]!
  detection(id: ID!): Detection
}

type Detection {
  id: ID!
  decision: Decision!
  riskScore: Int!
  # ...
}
```

**Avantages** :
- Single endpoint
- Flexible queries
- Type-safe (avec codegen)

**Inconvénients** :
- **Complexité énorme** : Schema, resolvers, subscriptions
- **Overhead** : Apollo Server, GraphQL tools
- **Learning curve** : Toute l'équipe doit apprendre GraphQL
- **Webhooks** = REST anyway

**Rejeté car** : Overkill total pour ce use case

---

## Consequences

### Positive
- ✅ **Clair et organisé** : Structure par fonctionnalité
- ✅ **Scalable** : Peut grandir proprement à 100+ routes
- ✅ **Versioning facile** : `/v1`, `/v2` coexistent
- ✅ **Auth granulaire** : Public, Protected, Admin séparés
- ✅ **RESTful** : Conventions claires, predictable
- ✅ **Standard** : Pas de framework spécial, juste Next.js
- ✅ **Compatible** : Webhooks + Protected API dans même app

### Negative
- ⚠️ **Verbosité** : Plus de fichiers que flat structure
- ⚠️ **Pas de type-safety end-to-end** : Frontend doit définir types séparément (mais peut générer avec openapi-typescript)

### Neutral
- 🔄 **Migration path exists** : Peut ajouter tRPC plus tard pour nouvelles features
- 🔄 **OpenAPI possible** : Peut générer spec OpenAPI pour docs

---

## Implementation Notes

### 1. Response Format Standard

```typescript
// lib/api/response.ts
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Usage
export async function GET(request: Request) {
  const detections = await fetchDetections();
  
  return Response.json({
    data: detections,
    pagination: {
      limit: 50,
      offset: 0,
      total: detections.length,
      hasMore: detections.length === 50,
    },
  } satisfies ApiResponse<FraudDetection[]>);
}
```

### 2. Error Handling Middleware

```typescript
// lib/api/error-handler.ts
export function withErrorHandler(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return Response.json(
          { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
          { status: 401 }
        );
      }
      
      if (error instanceof ForbiddenException) {
        return Response.json(
          { error: { code: 'FORBIDDEN', message: error.message } },
          { status: 403 }
        );
      }
      
      if (error instanceof z.ZodError) {
        return Response.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
          { status: 400 }
        );
      }
      
      // Unknown error
      logger.error('Unhandled API error', { error });
      return Response.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
    }
  };
}

// Usage
export const GET = withErrorHandler(async (request: Request) => {
  // Your logic...
});
```

### 3. Rate Limiting per Route

```typescript
// app/api/v1/detections/route.ts
import { orgRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const orgId = session.session.activeOrganizationId;
  
  // Rate limit check
  const { success, remaining } = await orgRateLimit.limit(orgId);
  
  if (!success) {
    return Response.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { 
        status: 429,
        headers: { 'X-RateLimit-Remaining': remaining.toString() }
      }
    );
  }
  
  // Continue...
}
```

### 4. Frontend API Client

```typescript
// lib/api/client.ts
class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    const response = await fetch(url.toString(), {
      credentials: 'include', // Better Auth cookies
    });
    
    if (!response.ok) {
      throw new ApiError(await response.json());
    }
    
    return response.json();
  }
  
  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new ApiError(await response.json());
    }
    
    return response.json();
  }
}

export const api = new ApiClient();

// Usage avec React Query
const { data } = useQuery({
  queryKey: ['detections', limit, offset],
  queryFn: () => api.get<FraudDetection[]>('/api/v1/detections', { limit, offset }),
});
```

---

## API Conventions

### HTTP Methods Mapping

```
GET     → Read (list or single)
POST    → Create
PATCH   → Update (partial)
PUT     → Replace (full)
DELETE  → Delete
```

### Status Codes

```
200 OK              → Success
201 Created         → Resource created
204 No Content      → Success with no response body
400 Bad Request     → Invalid input
401 Unauthorized    → Not authenticated
403 Forbidden       → Not authorized
404 Not Found       → Resource doesn't exist
429 Too Many Requests → Rate limit exceeded
500 Internal Error  → Server error
```

### URL Patterns

```
Collection:  GET    /api/v1/detections
Single:      GET    /api/v1/detections/:id
Action:      POST   /api/v1/detections/:id/review
Nested:      GET    /api/v1/customers/:id/transactions
```

---

## Related Decisions
- ADR-002: Database Strategy (RLS garantit isolation par org dans API)
- ADR-005: Type System (Branded types utilisés dans API handlers)
- ADR-008: Real-Time (SSE endpoint fait partie de l'API)

---

## Review Schedule
- **3 mois**: Analyser usage API (quels endpoints sont les plus utilisés)
- **6 mois**: Revoir si tRPC justifié pour améliorer DX
- **12 mois**: Évaluer si GraphQL ou OpenAPI spec nécessaires
