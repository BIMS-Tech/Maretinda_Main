# Production Dockerfile - Use Pre-Built Backend
# This Dockerfile uses the pre-built .medusa directory from local build

FROM node:20-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the ENTIRE pre-built backend directory (including .medusa)
COPY mercur/apps/backend /app

# Copy config files that Medusa CLI needs at root
RUN cp /app/.medusa/server/instrumentation.js /app/instrumentation.js 2>/dev/null || echo "export function register() {}" > /app/instrumentation.js
RUN cp /app/.medusa/server/medusa-config.js /app/medusa-config.js 2>/dev/null || cp /app/medusa-config.ts /app/medusa-config.js 2>/dev/null || true

# Copy workspace node_modules and packages (for @mercurjs modules)
COPY mercur/node_modules /workspace/mercur/node_modules
COPY mercur/packages /workspace/mercur/packages

# Link workspace node_modules to /app so imports work
RUN ln -sf /workspace/mercur/node_modules/@medusajs /app/node_modules/@medusajs 2>/dev/null || true && \
    ln -sf /workspace/mercur/node_modules/@mercurjs /app/node_modules/@mercurjs 2>/dev/null || true

# Set environment
ENV NODE_ENV=production
ENV PORT=9000
ENV NODE_PATH=/workspace/mercur/node_modules:/app/node_modules

EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start Medusa using the workspace CLI
CMD ["sh", "-c", "echo '🚀 Starting Medusa Backend...' && echo 'Port: $PORT' && node /workspace/mercur/node_modules/@medusajs/cli/cli.js start --host=0.0.0.0 --port=$PORT --types=false"]
