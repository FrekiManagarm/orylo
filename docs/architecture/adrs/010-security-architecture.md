# ADR-010: Security Architecture (Multi-Layer Defense)

**Date**: 2026-01-11  
**Status**: ✅ Accepted  
**Deciders**: Mathieu Chambaud, Mary (Business Analyst)

---

## Context

Orylo manipule des **données ultra-sensibles** :
- 💳 **Payment data** : Stripe IDs, montants, payment methods
- 👤 **Customer PII** : Emails, IPs, device fingerprints
- 🔐 **Organization secrets** : Stripe API keys, webhook secrets
- 🏢 **Business data** : Fraud rules, custom configurations

**Conséquences d'un breach** :
- 🚨 **Légal** : RGPD violations, amendes jusqu'à 4% du CA
- 💀 **Réputation** : Perte de confiance = fin du business
- 💰 **Financier** : Compensation clients, coûts légaux
- ⏱️ **Opérationnel** : Downtime, investigation, remediation

**Menaces identifiées** :
1. **ID mix-up** : Accès données d'une autre org (data leak)
2. **Injection attacks** : SQL injection, XSS, CSRF
3. **Broken authentication** : Session hijacking, weak passwords
4. **Broken authorization** : Privilege escalation
5. **Sensitive data exposure** : Secrets in logs, plaintext storage
6. **Rate limiting bypass** : DDoS, brute force
7. **Webhook spoofing** : Fake Stripe events

**Compliance requirements** :
- ✅ RGPD (EU data protection)
- ✅ PCI-DSS Level 4 (pas direct card data, mais Stripe connected)
- ✅ SOC 2 (future, pour enterprise clients)

---

## Decision

**Nous choisissons : Multi-Layer Security (Defense in Depth)**

```
SECURITY LAYERS (6 layers):
├─ Layer 1: Network (Vercel Edge, HTTPS enforced)
├─ Layer 2: Authentication (Better Auth + email verification)
├─ Layer 3: Authorization (RLS + RBAC 4 roles)
├─ Layer 4: Data Encryption (AES-256-GCM for secrets)
├─ Layer 5: Input Validation (Zod schemas on all inputs)
└─ Layer 6: Rate Limiting (1000 req/min per org, 100/min per IP)
```

**Principe** : Defense in Depth = si une layer fail, les autres protègent

---

## Layer 1: Network Security

**Vercel Edge Network** :
- ✅ HTTPS enforced (automatic SSL/TLS)
- ✅ DDoS protection (Vercel managed)
- ✅ Edge firewall (geo-blocking if needed)

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HSTS (Force HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // CSP (Content Security Policy)
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

---

## Layer 2: Authentication (Better Auth)

```typescript
// lib/auth/config.ts
import { betterAuth } from "better-auth";
import { organizationPlugin } from "better-auth/plugins";

export const auth = betterAuth({
  database: db,
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // ⚠️ MANDATORY
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  
  plugins: [
    organizationPlugin({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      // Role-based access
      allowedRoles: ['owner', 'admin', 'member', 'viewer'],
    }),
  ],
  
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL!,
  ],
  
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // 10 login attempts per minute
  },
});
```

**Password Policy** :
- Min 12 characters
- Must include: uppercase, lowercase, number, special char
- No common passwords (checked against breach DB)

**Email Verification** :
```typescript
// Only verified emails can access platform
if (!session.user.emailVerified) {
  redirect('/verify-email');
}
```

---

## Layer 3: Authorization (RLS + RBAC)

### 3.1 Row Level Security (Database)

```sql
-- Already covered in ADR-002
ALTER TABLE fraud_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON fraud_detections
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

### 3.2 Role-Based Access Control

```typescript
// lib/auth/roles.ts
export enum Role {
  OWNER = 'owner',       // Full access, can delete org
  ADMIN = 'admin',       // Manage users, rules, settings
  MEMBER = 'member',     // View detections, review transactions
  VIEWER = 'viewer',     // Read-only
}

export const permissions = {
  [Role.OWNER]: ['*'], // All permissions
  
  [Role.ADMIN]: [
    'detections:read',
    'detections:review',
    'customers:read',
    'customers:manage', // whitelist/blacklist
    'rules:read',
    'rules:manage',
    'settings:read',
    'settings:manage',
    'users:read',
    'users:invite',
  ],
  
  [Role.MEMBER]: [
    'detections:read',
    'detections:review',
    'customers:read',
  ],
  
  [Role.VIEWER]: [
    'detections:read',
    'customers:read',
  ],
};

// Middleware
export async function requirePermission(
  permission: string,
  session: Session
): Promise<void> {
  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.organizationId, session.session.activeOrganizationId)
    ),
  });
  
  if (!membership) {
    throw new ForbiddenError('Not a member of this organization');
  }
  
  const userPermissions = permissions[membership.role];
  const hasPermission = 
    userPermissions.includes('*') ||
    userPermissions.includes(permission);
  
  if (!hasPermission) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

// Usage in API route
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  await requirePermission('rules:manage', session);
  
  // User has permission, continue...
}
```

---

## Layer 4: Data Encryption

### 4.1 Secrets at Rest (AES-256-GCM)

```typescript
// lib/encryption/secrets.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

**Storage** :

```typescript
// Store Stripe secrets encrypted
await db.insert(organizations).values({
  id: organizationId,
  name: "ACME Corp",
  stripeSecretKey: encrypt(stripeKey), // ⚠️ ENCRYPTED
  stripePublishableKey: stripePublishableKey, // Public, no encryption
  webhookSecret: encrypt(webhookSecret), // ⚠️ ENCRYPTED
});

// Retrieve and decrypt
const org = await db.query.organizations.findFirst({
  where: eq(organizations.id, orgId),
});

const stripeKey = decrypt(org.stripeSecretKey);
const stripe = new Stripe(stripeKey);
```

### 4.2 Data in Transit (HTTPS)

- ✅ All API calls: HTTPS enforced
- ✅ Webhooks: HTTPS only
- ✅ Database: TLS connection (Neon enforces)

---

## Layer 5: Input Validation (Zod)

```typescript
// lib/validation/schemas.ts
import { z } from "zod";

export const CreateRuleSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid characters'),
  
  condition: z.object({
    field: z.enum(['amount', 'country', 'email', 'ipCountry']),
    operator: z.enum(['equals', 'greaterThan', 'lessThan', 'contains']),
    value: z.union([z.string(), z.number()]),
  }),
  
  action: z.enum(['ALLOW', 'REVIEW', 'BLOCK']),
  
  weight: z.number()
    .min(0, 'Weight must be positive')
    .max(100, 'Weight too high'),
  
  isActive: z.boolean().default(true),
});

// Usage in API route
export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    // ⚠️ VALIDATION: Reject invalid input
    const validated = CreateRuleSchema.parse(body);
    
    // Safe to use validated data
    await db.insert(customRules).values(validated);
    
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

**SQL Injection Prevention** :
```typescript
// ✅ SAFE: Drizzle uses parameterized queries
await db.query.fraudDetections.findFirst({
  where: eq(fraudDetections.id, detectionId), // Parameterized
});

// ❌ NEVER DO THIS (SQL injection vulnerable)
await db.execute(sql`SELECT * FROM fraud_detections WHERE id = ${detectionId}`); // ⚠️ UNSAFE
```

**XSS Prevention** :
```typescript
// React automatically escapes output
<div>{detection.aiExplanation}</div> // ✅ SAFE (React escapes)

// If using dangerouslySetInnerHTML, sanitize first
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(detection.aiExplanation)
}} />
```

---

## Layer 6: Rate Limiting

```typescript
// lib/rate-limit/limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Per organization rate limit
export const orgRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"), // 1000 req/min per org
  analytics: true,
  prefix: "ratelimit:org",
});

// Per IP rate limit (public endpoints)
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min per IP
  analytics: true,
  prefix: "ratelimit:ip",
});

// Stricter for login attempts
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 min
  analytics: true,
  prefix: "ratelimit:login",
});

// Usage
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const orgId = session.session.activeOrganizationId;
  
  const { success, remaining, reset } = await orgRateLimit.limit(orgId);
  
  if (!success) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }
  
  // Continue...
  return Response.json({ data }, {
    headers: {
      'X-RateLimit-Remaining': remaining.toString(),
    },
  });
}
```

---

## Webhook Security (Stripe Signature)

```typescript
// app/api/webhooks/stripe/[accountId]/route.ts
import Stripe from "stripe";

export async function POST(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  
  if (!signature) {
    logger.warn('Webhook missing signature', { accountId: params.accountId });
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }
  
  // Get webhook secret for this account
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.stripeAccountId, params.accountId),
  });
  
  if (!org) {
    logger.warn('Unknown Stripe account', { accountId: params.accountId });
    return Response.json({ error: "Unknown account" }, { status: 404 });
  }
  
  const webhookSecret = decrypt(org.webhookSecret);
  
  // ⚠️ VERIFY SIGNATURE (CRITICAL!)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    logger.error("Invalid webhook signature", {
      error: err,
      accountId: params.accountId,
      signature: signature.substring(0, 20) + '...',
    });
    
    return Response.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }
  
  // Signature valid, process event safely
  await processWebhook(event, org.id);
  
  return Response.json({ received: true });
}
```

---

## Logging Security (Scrub PII)

```typescript
// lib/logger.ts
function scrubSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const scrubbed = { ...obj };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'cardNumber',
    'cvv',
    'ssn',
  ];
  
  for (const field of sensitiveFields) {
    if (field in scrubbed) {
      scrubbed[field] = '[REDACTED]';
    }
  }
  
  // Mask email (keep domain)
  if (scrubbed.email) {
    const [local, domain] = scrubbed.email.split('@');
    scrubbed.email = `${local.substring(0, 2)}***@${domain}`;
  }
  
  // Recursively scrub nested objects
  for (const key in scrubbed) {
    if (typeof scrubbed[key] === 'object') {
      scrubbed[key] = scrubSensitiveData(scrubbed[key]);
    }
  }
  
  return scrubbed;
}

// Usage
logger.info('User logged in', scrubSensitiveData({
  userId,
  email: user.email, // Will be masked
  password: user.password, // Will be [REDACTED]
}));
```

---

## Alternatives Considered

### Alternative: Minimal Security (Not Recommended)

```typescript
// Just Better Auth + HTTPS
// ❌ No RBAC
// ❌ No encryption
// ❌ No rate limiting
// ❌ No input validation stricte
```

**Rejected because** : ONE security breach = game over for Orylo

---

## Consequences

### Positive
- ✅ **Defense in depth** : Multiple layers protect
- ✅ **Production-ready** : Couvre OWASP Top 10
- ✅ **RGPD compliant** : Encryption at rest + PII handling
- ✅ **PCI-DSS friendly** : No card data stored, secrets encrypted
- ✅ **Zero additional cost** : All tools already in stack

### Negative
- ⚠️ **Complexité** : 6 layers à maintenir
- ⚠️ **Performance overhead** : Validation + encryption (~5-10ms)

### Neutral
- 🔄 **Audit trail** : All security events logged
- 🔄 **Penetration testing** : Should be done annually

---

## Security Checklist

**Before Production** :
- [ ] All secrets encrypted at rest
- [ ] Email verification enabled
- [ ] RLS enabled on all multi-tenant tables
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Webhook signature verification
- [ ] HTTPS enforced (HSTS)
- [ ] CSP headers configured
- [ ] Sentry PII scrubbing enabled
- [ ] Logs scrub sensitive data
- [ ] Admin endpoints require owner role
- [ ] Environment variables secured (Vercel secrets)

**Ongoing** :
- [ ] Weekly: Review Sentry errors for security issues
- [ ] Monthly: Audit user permissions
- [ ] Quarterly: Review rate limit thresholds
- [ ] Annually: Penetration testing

---

## Related Decisions
- ADR-002: Database Strategy (RLS = Layer 3)
- ADR-005: Type System (Prevents ID mix-up bugs)
- ADR-009: Observability (Sentry scrubs PII)

---

## References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [RGPD Guidelines](https://gdpr.eu/)
- [Better Auth Security](https://www.better-auth.com/docs/security)
- [Vercel Security](https://vercel.com/docs/security)

---

## Review Schedule
- **1 mois**: Penetration testing (internal ou Bugcrowd)
- **3 mois**: Security audit (code review for vulnerabilities)
- **6 mois**: RGPD compliance audit
- **12 mois**: SOC 2 certification preparation
