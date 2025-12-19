# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orylo is an AI-powered fraud detection SaaS platform for Stripe. It analyzes payment transactions in real-time using AI agents (OpenAI/Anthropic) and rule-based checks to detect fraudulent activity.

## Development Commands

```bash
# Development
bun dev              # Start Next.js dev server (localhost:3000)
bun dev:mastra       # Start Mastra AI agent dev mode

# Build & Production
bun build            # Build for production
bun start            # Run production server
bun run lint             # Run ESLint

# Database (Drizzle ORM)
bun db:push          # Push schema changes to database
bun db:generate      # Generate migration files
bun db:migrate       # Run migrations
bun db:studio        # Open Drizzle Studio (database GUI)
bun db:pull          # Pull schema from database
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16.1 (App Router) with React 19
- **Database:** PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication:** Better-Auth with multi-organization support, 2FA
- **Payments:** Stripe (Connect OAuth integration)
- **AI:** Mastra framework with OpenAI (GPT-4o) and Anthropic (Claude) models
- **Billing:** Autumn (atmn) for metering and feature flags
- **UI:** Tailwind CSS 4 + Shadcn UI (Radix primitives)
- **State:** React Query, Zustand, nuqs (URL state)

### App Structure (Route Groups)

```
app/
├── (marketing)/          # Public pages: landing, blog, contact, privacy
├── (auth)/              # Authentication: sign-in, sign-up, reset password
├── (main)/              # Protected dashboard (requires auth)
│   └── dashboard/       # Multi-level dashboard with sidebar layout
│       ├── page.tsx     # Overview: stats, charts, recent transactions
│       ├── settings/    # Organization settings, Stripe connection
│       ├── transactions/ # Transaction list with fraud analysis
│       ├── alerts/      # Fraud alerts management
│       └── rules/       # Custom fraud detection rules
└── api/                 # API routes (auth, Stripe, webhooks, fraud-analyses)
```

### Database Schema (PostgreSQL)

**Core Tables:**
- `organization` - Multi-tenant organizations with trial tracking
- `user` / `member` / `invitation` - User management
- `session` / `account` / `verification` / `twoFactor` - Better-Auth tables
- `stripeConnections` - Encrypted OAuth tokens for Stripe Connect accounts
- `fraudAnalyses` - AI-powered fraud analysis results
- `rules` / `whitelistEntries` / `blacklistEntries` - Custom fraud rules
- `webhookLogs` - Audit trail for all Stripe webhook events
- `alerts` - Fraud alert notifications
- `settings` - Organization-specific settings

All schemas located in `lib/schemas/` with auto-generated Zod schemas.

### Stripe Integration

**Connection Flow:**
1. `/api/stripe/connect/start` - Generates OAuth URL
2. User authorizes Stripe account
3. `/api/stripe/connect/callback` - Exchanges code for tokens
4. Tokens encrypted with AES-256-GCM and stored in `stripeConnections` table

**Security:**
- Tokens encrypted using `lib/stripe/encryption.ts` (AES-256-GCM + PBKDF2)
- Format: `salt:iv:authTag:encryptedData` (hex-encoded)
- Requires `ENCRYPTION_KEY` env var (32-char hex)

**Webhook Processing:**
- Route: `/api/webhooks/stripe/[accountId]`
- Signature verification with stored `webhookSecret`
- Events logged to `webhookLogs` table
- Handlers in `lib/actions/webhook-handlers.ts`

### Fraud Detection Pipeline

```
Webhook: payment_intent.created or other stripe events linked to 
    ↓
1. Quick Checks (< 100ms)
   - Whitelist/blacklist lookup
   - Disposable email detection
   - High-risk country check
   - VPN/proxy detection
    ↓
2. Decision Fork
   - Whitelisted → ACCEPT (skip AI)
   - Blacklisted → BLOCK (skip AI)
   - Uncertain → Proceed to AI
    ↓
3. AI Analysis (if needed)
   - Model selection based on plan:
     * Starter → gpt-4o-mini
     * Growth → gpt-4o
     * Enterprise → claude-3-5-sonnet
   - Agent tools:
     * checkEmailReputation
     * getIPGeolocation
   - Returns: riskScore, recommendation, reasoning
    ↓
4. Action Execution
   - Save to fraudAnalyses table
   - Execute recommendation (accept/block/require_3ds)
   - Send alert if configured
   - Update usage counter (Autumn)
```

**Circuit Breaker:** Prevents cascading failures when AI service unavailable (see `lib/circuit-breaker.ts`). After 5 failures, enters OPEN state for 60s, returns "REVIEW" fallback.

### Mastra AI Integration

Located in `lib/mastra/`:
- **Agent:** `fraudAnalyzer` - Fraud detection expert with structured analysis
- **Tools:** Email reputation checker, IP geolocation
- **Model Config:** Dynamic selection via `getModelForOrganization()` based on Autumn feature flags
- **Storage:** LibSQLStore (in-memory for dev)

### Authentication (Better-Auth)

**Server:** `lib/auth/auth.server.ts` - Drizzle adapter with plugins:
- `nextCookies()` - Session cookies
- `autumn()` - Billing integration
- `organization()` - Multi-tenancy with custom fields (phone, trial dates)
- `twoFactor()` - 2FA support

**Client:** `lib/auth/auth.client.ts` - Exports `authClient`, `useSession`, `useActiveOrganization`

Protected routes verify session and organization membership in dashboard layout.

### Billing & Feature Flags (Autumn)

Configuration in `autumn.config.ts`:

**Feature Flags:**
- `transactions` (single_use) - Transaction analysis limit
- `api_access` (boolean) - API access toggle
- `priority_email_support` (boolean)
- `rules` (single_use) - Custom rule limit
- `stripe_accounts` (single_use) - Connected account limit
- `advanced_ai_agents` (boolean) - Claude Sonnet access

**Tiers:** Starter (5-7) and Growth (1-7) with monthly/yearly variants.

Usage metering integrated into fraud analysis flow.

### Component Patterns

**Server vs Client:**
- Server Components: Data fetching, async operations (e.g., `StatsGrid` in dashboard)
- Client Components: Interactive elements, hooks (e.g., `RefreshButton`)
- Pattern: Server component fetches → passes data to client component

**Organization:**
```
components/
├── ui/                  # Shadcn UI primitives (58 Radix components)
├── auth/                # Auth pages
├── organization/        # Org management dialogs
├── dashboard/
│   ├── layout/         # Sidebar, header
│   ├── dialogs/        # Account switch, user profile
│   └── pages/          # Page-specific components
└── marketing/          # Landing page components
```

### Design System (Dark Theme)

See `.cursor/rules/design-system.mdc` for comprehensive rules.

**Visual Identity:**
- Backgrounds: `bg-black`, `bg-zinc-900/50 backdrop-blur-xl`
- Borders: `border-white/10` (subtle, semi-transparent)
- Typography: White headings, `text-zinc-400` secondary text, `text-indigo-400` accents
- Primary Button: `bg-white text-black hover:bg-zinc-200`
- Inputs: `bg-zinc-900/50 border-white/10 focus-visible:ring-indigo-500`

**Animation:** Framer Motion with standard `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`

**Don'ts:**
- No white backgrounds for main pages
- No solid black borders
- No default blue links
- Avoid harsh shadows (prefer glows/blurs)

### API Routes Structure

**Authentication:**
- `/api/auth/[...all]` - Better-Auth handler

**Stripe:**
- `/api/stripe/connect/{start,callback,status,disconnect}`
- `/api/webhooks/stripe/[accountId]` - Event processing

**Fraud:**
- `/api/fraud-analyses` - List/filter analyses
- `/api/fraud-analyses/[id]` - Get single analysis
- `/api/fraud-analyses/stats` - Statistics

**Other:**
- `/api/autumn/[...all]` - Billing proxy
- `/api/og` - Dynamic OG images

### Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random-string>

# Encryption (64-char hex)
ENCRYPTION_KEY=<64-hex-chars>

# Stripe
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Billing
AUTUMN_SECRET_KEY=ask_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Patterns & Conventions

### Server Actions
All data mutations use `"use server"` directive. Located in `lib/actions/`.

**Example:**
```typescript
"use server"
export async function createFraudAnalysis(data: InsertFraudAnalysis) {
  const session = await validateSession()
  // ... implementation
}
```

### Type Safety
- Database types auto-generated from Drizzle schemas
- Zod schemas via `createInsertSchema` / `createSelectSchema`
- Full TypeScript strict mode throughout

### Error Handling
- Circuit breaker for AI service failures
- Webhook retry logic with retry count tracking
- Fallback recommendations when AI unavailable
- Toast notifications (Sonner) for user-facing errors

### Security Best Practices
- Never store unencrypted tokens
- Always verify webhook signatures
- Validate session on protected routes
- Encrypt sensitive data at rest (tokens, secrets)
- Use server actions for mutations (CSRF protection)

## Development Workflow

1. **Database Changes:** Modify schema in `lib/schemas/` → `npm run db:push`
2. **Component Creation:** Follow design system rules, use Shadcn UI primitives
3. **New Features:** Check Autumn feature flags, respect tier limits
4. **API Routes:** Validate auth, handle errors, log important events
5. **Fraud Rules:** Add quick checks before AI analysis to optimize cost

## Testing Fraud Detection

Use `lib/actions/simulate-payment.ts` to create test payment events without real Stripe webhooks.
