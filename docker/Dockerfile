# Multi-stage build for the Next.js app (standalone output).
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
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
RUN pnpm prisma generate
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
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
