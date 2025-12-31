# Admin Panel Dockerfile
FROM node:22-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies for building and serving
RUN apk add --no-cache curl

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

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
ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL \
    VITE_MEDUSA_STOREFRONT_URL=$VITE_MEDUSA_STOREFRONT_URL \
    VITE_MEDUSA_BASE=$VITE_MEDUSA_BASE \
    VITE_MEDUSA_B2B_PANEL=$VITE_MEDUSA_B2B_PANEL \
    NODE_ENV=production

# Build the application
RUN yarn build:preview

# Stage 3: Runner
FROM base AS runner

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built files and dependencies
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

# Expose port 3000 (NOT 5173 - that's dev server)
EXPOSE 3000

# Set runtime environment variables
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the application (serves the built files)
CMD ["yarn", "start"]
