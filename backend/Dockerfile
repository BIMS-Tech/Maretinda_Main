# ========================================
# Maretinda Backend - Dockerfile
# ========================================
# Uses node:20-slim (Debian/glibc) so sharp uses prebuilt binaries
# instead of compiling from source on Alpine (which takes 30-60+ min)

# Stage 1: Base image with dependencies
FROM node:20-slim AS base
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies installation
FROM base AS deps
WORKDIR /app

# Enable corepack for Yarn 3
RUN corepack enable

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies (prod + dev needed for build)
RUN yarn install --immutable

# Stage 3: Builder
FROM base AS builder
WORKDIR /app

# Enable corepack for Yarn 3
RUN corepack enable

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build payment-giyapay module first
WORKDIR /app/src/modules/payment-giyapay
RUN npm install
RUN npm run build

# Build file-gcs module
WORKDIR /app/src/modules/file-gcs
RUN npm install
RUN npm run build

# Build main application
WORKDIR /app
RUN yarn build

# Stage 4: Production runner
FROM node:20-slim AS runner
WORKDIR /final

# Install production dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    tini \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

# Create non-root user with home directory (Medusa writes config to ~/.config/medusa)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m -d /home/medusa -s /bin/bash medusa && \
    mkdir -p /home/medusa/.config && \
    chown -R medusa:nodejs /home/medusa

# Copy necessary files from builder
COPY --from=builder --chown=medusa:nodejs /app/package*.json ./
COPY --from=builder --chown=medusa:nodejs /app/.yarnrc.yml ./
COPY --from=builder --chown=medusa:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:nodejs /app/.medusa ./.medusa
COPY --from=builder --chown=medusa:nodejs /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder --chown=medusa:nodejs /app/tsconfig.json ./tsconfig.json

# Copy built payment-giyapay module
COPY --from=builder --chown=medusa:nodejs /app/src/modules/payment-giyapay/dist ./src/modules/payment-giyapay/dist
COPY --from=builder --chown=medusa:nodejs /app/src/modules/payment-giyapay/package.json ./src/modules/payment-giyapay/package.json

# Copy built file-gcs module
COPY --from=builder --chown=medusa:nodejs /app/src/modules/file-gcs/dist ./src/modules/file-gcs/dist
COPY --from=builder --chown=medusa:nodejs /app/src/modules/file-gcs/package.json ./src/modules/file-gcs/package.json

# Copy source files (for scripts and loaders)
COPY --from=builder --chown=medusa:nodejs /app/src ./src

# Copy static and config files
COPY --from=builder --chown=medusa:nodejs /app/config ./config

# Set environment variables
ENV NODE_ENV=production \
    PORT=9000 \
    LOG_LEVEL=info \
    MEDUSA_DISABLE_TELEMETRY=1 \
    HOME=/home/medusa

# Switch to non-root user
USER medusa

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

# Use tini to handle signals properly
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start the server
CMD ["node_modules/.bin/medusa", "start"]
