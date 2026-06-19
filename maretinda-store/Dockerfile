# Simple Next.js Dockerfile
FROM node:22-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Accept build-time public config (Next.js inlines NEXT_PUBLIC_* at build).
# .env.local is gitignored and not uploaded to Cloud Build, so prod values
# must come through build args.
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=ph
ARG NEXT_PUBLIC_STRIPE_KEY
ARG NEXT_PUBLIC_SITE_NAME=Maretinda
ARG NEXT_PUBLIC_SITE_DESCRIPTION=Maretinda
ARG NEXT_PUBLIC_ALGOLIA_ID
ARG NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ARG NEXT_PUBLIC_TALKJS_APP_ID
ARG NEXT_PUBLIC_GIYAPAY_SANDBOX_MODE=true
ARG MEDUSA_BACKEND_URL

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_SITE_DESCRIPTION=$NEXT_PUBLIC_SITE_DESCRIPTION \
    NEXT_PUBLIC_ALGOLIA_ID=$NEXT_PUBLIC_ALGOLIA_ID \
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_KEY \
    NEXT_PUBLIC_TALKJS_APP_ID=$NEXT_PUBLIC_TALKJS_APP_ID \
    NEXT_PUBLIC_GIYAPAY_SANDBOX_MODE=$NEXT_PUBLIC_GIYAPAY_SANDBOX_MODE \
    MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL
RUN npm run build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application with custom server
CMD ["node", "server.js"]
