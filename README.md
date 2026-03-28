# Supplement Manager

Track what supplements you and your household take, monitor inventory, and get email alerts when you're running low.

Live at **[supplement-manager.com](https://supplement-manager.com)**

---

## Features

- Add supplements with ingredient, dose, brand, source, and cost
- Track multiple people in one household
- Automatic daily deduction of units at a configurable time
- Calendar view of past intake with skip/restore controls
- Low-stock email alerts (< 7 days = critical, < 14 days = warning)
- Cost summary per person per day/month
- Drag-and-drop supplement reordering
- Google sign-in — each account has its own isolated data

---

## Tech Stack

| Layer | Service | Link |
|---|---|---|
| Framework | Next.js 15 (App Router) | [nextjs.org](https://nextjs.org) |
| Language | TypeScript | [typescriptlang.org](https://www.typescriptlang.org) |
| Styling | Tailwind CSS | [tailwindcss.com](https://tailwindcss.com) |
| ORM | Prisma | [prisma.io](https://prisma.io) |
| Database | Neon (PostgreSQL) | [neon.tech](https://neon.tech) |
| Auth | NextAuth.js v5 + Google OAuth | [authjs.dev](https://authjs.dev) |
| Email | Resend | [resend.com](https://resend.com) |
| Hosting | Vercel | [vercel.com](https://vercel.com) |
| Cron | Vercel Cron | [vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs) |

---

## External Accounts & Resources

| Service | What it's used for | Dashboard |
|---|---|---|
| **Google Cloud Console** | OAuth credentials for sign-in | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) |
| **Neon** | Hosted PostgreSQL database | [console.neon.tech](https://console.neon.tech) |
| **Resend** | Sending low-stock alert emails | [resend.com/overview](https://resend.com/overview) |
| **Vercel** | Hosting + cron jobs | [vercel.com/dawidawi1710s-projects/sup](https://vercel.com/dawidawi1710s-projects/sup) |
| **GitHub** | Source code | [github.com/dawidawi1710/sup](https://github.com/dawidawi1710/sup) |
| **Cloudflare** | DNS for supplement-manager.com | [dash.cloudflare.com](https://dash.cloudflare.com) |

---

## Local Development Setup

### Prerequisites

- [Node.js 20+](https://nodejs.org) (on Windows, use the installer or [nvm-windows](https://github.com/coreybutler/nvm-windows))
- [Git](https://git-scm.com)

### 1. Clone the repo

```bash
git clone https://github.com/dawidawi1710/sup.git
cd sup
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file:

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Then fill in the values in `.env` (see [Environment Variables](#environment-variables) below).

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

All variables go in `.env` (local) and must also be added to Vercel for production.

```env
# NextAuth — session encryption secret
# Generate with: openssl rand -base64 32
# Windows alternative: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET=""

# Google OAuth credentials
# From: console.cloud.google.com/apis/credentials → your OAuth 2.0 Client ID
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Neon PostgreSQL — pooled connection (used at runtime)
DATABASE_URL="postgresql://user:password@ep-xxx.pooler.neon.tech/dbname?sslmode=require"

# Neon PostgreSQL — direct connection (used for migrations)
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# Resend — email notifications API key
# From: resend.com/api-keys
RESEND_API_KEY=""

# Vercel Cron — secret to authenticate cron requests
# Generate with: openssl rand -hex 32
# Windows alternative: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=""
```

### Where to get each value

**Google OAuth (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)**
1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth 2.0 Client ID
3. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs (for local dev)

**Neon (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`)**
1. Go to [console.neon.tech](https://console.neon.tech) → your project → Connection Details
2. Copy the **Pooled** connection string → `DATABASE_URL`
3. Copy the **Direct** connection string → `DATABASE_URL_UNPOOLED`

**Resend (`RESEND_API_KEY`)**
1. Go to [resend.com/api-keys](https://resend.com/api-keys) → Create API key

---

## Commands

```bash
npm run dev          # Start development server
npm run build        # Generate Prisma client + production build
npm run lint         # Run ESLint
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Run new migrations (prompts for migration name)
npm run db:studio    # Open Prisma Studio GUI to inspect data
```

---

## Deployment

The app is hosted on Vercel. Deployments are currently **manual**:

```bash
vercel --prod
```

To set up **automatic deploys on every push**, connect the GitHub repo in the Vercel dashboard:
Settings → Git → Connect Repository → `dawidawi1710/sup`

### Adding environment variables to Vercel

```bash
vercel env add VARIABLE_NAME production
```

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                  # Server component — fetches data, checks auth
│   ├── SupplementsClient.tsx     # Main client component — all UI state
│   ├── actions.ts                # Server actions — all DB mutations
│   ├── CalendarModal.tsx         # Calendar view modal
│   ├── NewSupplementModal.tsx    # Create/edit supplement modal
│   ├── DeleteConfirmModal.tsx    # Delete confirmation modal
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth handler
│       └── cron/                 # Vercel Cron endpoint (daily deductions + emails)
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── scheduler.ts              # node-cron scheduler (local dev only)
│   └── email.ts                  # Resend email templates
├── auth.ts                       # NextAuth config (Google provider)
├── middleware.ts                 # Route protection
└── instrumentation.ts            # Initialises local scheduler on startup
prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Migration history
```

**Data flow:**
1. `page.tsx` (server) — checks auth, fetches all data from Prisma, passes to client
2. `SupplementsClient.tsx` (client) — owns all UI state, optimistic updates
3. `actions.ts` (server actions) — all mutations, each calls `revalidatePath('/')`
4. `api/cron` — runs at 22:00 UTC daily via Vercel Cron: deducts units + sends low-stock emails

---

## Database Schema

| Model | Purpose |
|---|---|
| `User` | Google account + notification email preference |
| `Account` / `Session` | NextAuth internals |
| `Person` | Household member taking supplements |
| `Supplement` | Product with inventory (packageUnits stored as JSON array) |
| `SupplementPerson` | Per-person settings: takingDaily, unitsPerDay, startDate |
| `DeductionLog` | Audit log of every unit deduction |
| `SkippedIntake` | Record of manually skipped days |
| `Settings` | Key-value store (e.g. deduction time) |

---

## Email Alerts

The cron job runs every day at 22:00 UTC and sends one email per user if any supplements are low:

- **Critical** (< 7 days remaining) — red section
- **Warning** (< 14 days remaining) — amber section

Days remaining = `unitsLeft ÷ combinedUnitsPerDay` across all active persons.

Emails are sent from `notifications@supplement-manager.com` via Resend.
The recipient defaults to the Google account email, overridable per-account via the email pill in the toolbar.
