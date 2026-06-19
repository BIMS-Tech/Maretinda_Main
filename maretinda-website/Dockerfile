# Maretinda marketing website - Next.js
FROM node:22-alpine
RUN apk add --no-cache curl
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
RUN npm run build

# Non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080
ENV PORT=8080 HOSTNAME="0.0.0.0"
# next start honours $PORT
CMD ["npm", "run", "start", "--", "-p", "8080", "-H", "0.0.0.0"]
