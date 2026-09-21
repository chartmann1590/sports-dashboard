# Stage 1: Build Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client

# AdMob IDs for prod (pass via --build-arg, sourced from GitHub Secrets in CI).
# Never hardcode real IDs here — Vite embeds non-empty VITE_* values at build time.
ARG VITE_ADS_ENABLED=true
ARG VITE_ADMOB_APP_ID=""
ARG VITE_ADMOB_BANNER_AD_ID=""
ARG VITE_ADMOB_INTERSTITIAL_AD_ID=""
ENV VITE_ADS_ENABLED=$VITE_ADS_ENABLED
ENV VITE_ADMOB_APP_ID=$VITE_ADMOB_APP_ID
ENV VITE_ADMOB_BANNER_AD_ID=$VITE_ADMOB_BANNER_AD_ID
ENV VITE_ADMOB_INTERSTITIAL_AD_ID=$VITE_ADMOB_INTERSTITIAL_AD_ID

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
COPY scripts/ ../scripts/
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server/index.js"]
