# Production Dockerfile for Medusa backend with local packages
FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy entire monorepo
COPY . .

# Install dependencies for the entire workspace
RUN yarn install --frozen-lockfile

# Build all packages first
RUN yarn build

# Set working directory to backend
WORKDIR /app/apps/backend

# Environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start command
CMD ["node", "server.js"]
