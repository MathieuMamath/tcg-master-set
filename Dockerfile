# The production image: the Next.js standalone server, run by a user without privileges.
# Built by Coolify from main. It holds no secrets and no card data: the environment comes from
# the host, and the cards from the database.

# Pinned to the patch, so that a floating tag stuck in a build cache can't miss a security fix.
FROM node:26.13.0-alpine AS base
# Node no longer ships corepack, so pnpm is installed at the version package.json names.
RUN npm install -g pnpm@10.34.9
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Without --ignore-scripts, `prepare` would try to install the Git hooks, and there is no .git.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# The build needs no database and no secret: both are only read on the first request.
RUN pnpm build

FROM node:26.13.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
