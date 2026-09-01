# Single build stage: package.json's `postinstall` runs `prisma generate`, which
# needs prisma/schema.prisma + a resolvable DATABASE_URL already present — so the
# full source must be copied in *before* `pnpm install` runs (no separate
# deps-only caching stage). Rebuilds are infrequent for this tool, so trading
# some build-cache speed for a simpler, correct Dockerfile is the right call.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY . .
# Build-time-only placeholders: `prisma generate` and `next build` just need these
# env vars to be resolvable, not a live connection. Real values are supplied at
# `docker run`/compose time and are NOT baked into this image (each Docker stage
# starts with a fresh environment; this ENV does not carry over to the runner stage).
ENV DATABASE_URL="mysql://build:build@localhost:3306/build" \
    AUTH_SECRET="build-time-placeholder" \
    AZURE_AD_CLIENT_ID="build" \
    AZURE_AD_CLIENT_SECRET="build" \
    AZURE_AD_TENANT_ID="build"
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
# Full node_modules (not just the pruned .next/standalone set) so `prisma migrate
# deploy` has the Prisma CLI + driver adapter available at container start.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# prisma/seed.ts imports src/lib/prisma.ts (which imports the generated client
# under src/generated/prisma) — the standalone Next.js output doesn't preserve
# this source tree, so it's copied explicitly for `prisma db seed` to run.
COPY --from=builder /app/src ./src
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
