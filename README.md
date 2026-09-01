# Jumuah Duty Scheduler

Internal app for ~6 pengurus to manage Jumuah prayer duty scheduling: Room
Booking (fixed assignment), Khatib and Imam (independent skip-unavailable
rotations), unavailability/replacement handling, and H-1 email reminders.

Stack: Next.js 16 (App Router) + TypeScript, Prisma 7 + MySQL (via the
`mariadb` driver adapter), NextAuth v5 with Microsoft Entra ID, Resend,
Tailwind v4 + shadcn/ui, Vitest, Docker Compose.

## Prerequisites (manual, one-time)

1. **Microsoft Entra ID (Azure AD) app registration** — required for sign-in.
   - Redirect URI: `{AUTH_URL}/api/auth/callback/microsoft-entra-id`
     (e.g. `http://localhost:3000/api/auth/callback/microsoft-entra-id` for
     local dev, or your production URL).
   - Generate a client secret.
   - Note the Application (client) ID, client secret, and Directory (tenant) ID.
2. **Resend account** (for H-1 reminder emails) — an API key and a verified
   sending domain. Optional for local dev: leave `RESEND_API_KEY` unset and
   emails are logged to the console instead of sent.
3. Copy `env.example` to `.env` and fill in real values (`.env` is git-ignored).
   `SEED_ADMIN_EMAIL` should be the first admin's own email — nobody can sign
   in until this row is seeded, since sign-in requires a pre-existing,
   active `User` row (admin-must-pre-provision; there's no self-signup).

## Local development

```bash
pnpm install
docker compose up -d mysql   # local dev database only
pnpm db:migrate              # applies prisma/migrations
pnpm db:seed                 # seeds the first admin + app settings + rotation state
pnpm dev
```

Then sign in at `http://localhost:3000/signin` as the seeded admin, and use
**Admin → Members** to onboard the rest of the ~6 pengurus (each must be
added before they can sign in themselves).

Admin setup order: **Members** → **Rotation** (Khatib/Imam order) →
**Settings** (fixed room booker) → **Schedules** (generate the next N Fridays).

## Testing

```bash
pnpm test          # rotation/schedule-generation engine unit tests (no DB needed)
pnpm test:watch
```

The rotation engine (`src/lib/scheduling/rotation.ts`,
`generate-schedule.ts`) is pure and fully unit-tested. Integration-level
scenarios (generate → mark unavailable → take replacement, idempotent
regeneration, notification-log idempotency) should be exercised manually
against a real database — see the plan's testing strategy for the specific
scenarios worth checking.

## Deployment (Docker Compose)

```bash
cp env.example .env   # fill in real values on the server
docker compose up -d --build
```

This brings up three containers:
- **mysql** — data persists in the `mysql_data` named volume across
  `docker compose down`/redeploys (only `docker compose down -v` removes it).
- **app** — the Next.js app (`docker/Dockerfile`, standalone output). On
  every start, its entrypoint runs `prisma migrate deploy` then `prisma db
  seed` (idempotent) before starting the server. Exposes port `3000` on the
  host.
- **scheduler** — a minimal Alpine + busybox-cron container
  (`docker/scheduler`) that POSTs to the app's `/api/cron/reminders` once
  daily (`docker/scheduler/crontab`) with a shared secret (`CRON_SECRET`).

Put a reverse proxy in front of the `app` container's exposed port (e.g.
Caddy on the host, `reverse_proxy localhost:3000`) to terminate TLS and
serve the app on your domain. `mysql`'s port is bound to `127.0.0.1` only
(not reachable from outside the host) — useful for local inspection via a
DB client, never exposed to the network.

Verified end-to-end (clean volume → build → migrate → seed → serve →
scheduler auth) via `docker compose up -d --build` during development.

### Adding a future migration

Schema changes need a new migration file generated against a real database
before deploying (`prisma migrate deploy` only applies existing migration
files — it never generates one):

```bash
docker compose up -d mysql
DATABASE_URL="mysql://root:root@127.0.0.1:3306/masjid" pnpm exec prisma migrate dev --name <change-description>
```

(Use the root credentials only for this one-off step — schema changes need
privileges the app's regular `masjid` user intentionally doesn't have.)
Commit the resulting `prisma/migrations/<timestamp>_<name>/` folder.

## Project structure

- `prisma/schema.prisma` — data model. `prisma.config.ts` holds the
  connection config (Prisma 7 moved this out of `schema.prisma`).
- `src/lib/scheduling/` — pure rotation/schedule-generation engine
  (`rotation.ts`, `generate-schedule.ts`) plus the Prisma-backed
  orchestration (`persist.ts`) and read queries (`queries.ts`).
- `src/server/actions/` — Server Actions for all mutations (member/rotation/
  settings admin config, schedule generation + manual override,
  unavailability + replacement flow).
- `src/lib/email/` — `EmailProvider` interface with Resend and console
  (dev fallback) implementations, plus the H-1/weekly-summary send logic.
- `src/auth.ts` / `src/proxy.ts` — NextAuth v5 config and route guard
  (Next.js 16 renamed `middleware.ts` to `proxy.ts`).
