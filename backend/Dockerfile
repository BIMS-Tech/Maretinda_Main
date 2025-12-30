# ========================================
# Maretinda Backend - Dockerfile
# ========================================
# Multi-stage build for production deployment

# Stage 1: Base image with dependencies
FROM node:20-alpine AS base
WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    bash

# Stage 2: Dependencies installation
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development

# Stage 3: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build payment-giyapay module first
WORKDIR /app/src/modules/payment-giyapay
RUN npm install
RUN npm run build

# Build main application
WORKDIR /app
RUN npm run build

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /final

# Install production dependencies
RUN apk add --no-cache \
    bash \
    curl \
    tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S medusa -u 1001

# Copy necessary files from builder
COPY --from=builder --chown=medusa:nodejs /app/package*.json ./
COPY --from=builder --chown=medusa:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:nodejs /app/.medusa ./.medusa
COPY --from=builder --chown=medusa:nodejs /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder --chown=medusa:nodejs /app/tsconfig.json ./tsconfig.json

# Copy built payment-giyapay module
COPY --from=builder --chown=medusa:nodejs /app/src/modules/payment-giyapay/dist ./src/modules/payment-giyapay/dist
COPY --from=builder --chown=medusa:nodejs /app/src/modules/payment-giyapay/package.json ./src/modules/payment-giyapay/package.json

# Copy source files (for scripts and loaders)
COPY --from=builder --chown=medusa:nodejs /app/src ./src

# Copy static and config files
COPY --from=builder --chown=medusa:nodejs /app/config ./config

# Set environment variables
ENV NODE_ENV=production \
    PORT=9000 \
    LOG_LEVEL=info

# Switch to non-root user
USER medusa

# Expose port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server
CMD ["npm", "start"]

