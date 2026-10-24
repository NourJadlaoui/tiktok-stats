# Multi-stage build — see README "Deploying to OVH Public Cloud" for the
# full walkthrough (this file is one of two supported deploy paths, the
# other being a plain PM2 + Nginx install directly on a Compute instance).

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Values baked in at build time only need to be *valid*, not real — the
# actual runtime env vars come from `docker run --env-file` / your
# orchestrator, not from this build. NEXT_PUBLIC_* vars are the exception:
# Next.js inlines those into the client bundle at build time, so pass the
# real ones as --build-arg if you rely on them client-side.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime stage uses Playwright's own image so Chromium + all its system
# libraries are already present and version-matched to the `playwright` npm
# package — avoids hand-listing the dozen apt packages Chromium needs.
FROM mcr.microsoft.com/playwright:v1.61.1-jammy AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# `output: 'standalone'` (next.config.js) traces only the files actually
# needed at runtime into .next/standalone, including a pruned node_modules —
# no separate `npm install` needed in this stage.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
