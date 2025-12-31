# Admin Panel Dockerfile for Cloud Run
FROM node:22-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Stage 2: Builder
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Accept build arguments for Vite environment variables
ARG VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app
ARG VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
ARG VITE_MEDUSA_BASE=/
ARG VITE_MEDUSA_B2B_PANEL=false

# Set environment variables for build
ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL
ENV VITE_MEDUSA_STOREFRONT_URL=$VITE_MEDUSA_STOREFRONT_URL
ENV VITE_MEDUSA_BASE=$VITE_MEDUSA_BASE
ENV VITE_MEDUSA_B2B_PANEL=$VITE_MEDUSA_B2B_PANEL
ENV NODE_ENV=production

# Build the application (creates /app/dist)
RUN echo "Building with BACKEND_URL: $VITE_MEDUSA_BACKEND_URL" && \
    yarn build:preview && \
    echo "Build complete. Checking dist folder..." && \
    ls -la dist/ || echo "Dist folder not found!"

# Stage 3: Runner - Slim production image
FROM node:22-alpine AS runner

# Install curl for health checks and serve for static file serving
RUN apk add --no-cache curl && \
    npm install -g serve

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    mkdir -p /app && \
    chown -R appuser:nodejs /app

WORKDIR /app

# Copy only the built dist folder
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

USER appuser

# Expose port
EXPOSE 3000

# Set runtime environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start static file server on port 3000
CMD ["serve", "-s", "dist", "-l", "3000", "--no-clipboard"]
