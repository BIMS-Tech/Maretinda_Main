#!/bin/bash

# Post-Deployment Setup Script
# Run this AFTER the backend is deployed to Cloud Run
# This will seed the database and create admin user

set -e

PROJECT_ID="maretinda-test"
REGION="europe-west1"
SERVICE_NAME="maretinda-backend"

echo "🎯 Post-Deployment Setup for Maretinda Backend"
echo "=============================================="
echo ""

# Get the Cloud Run service URL
echo "📡 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo "✅ Service URL: $SERVICE_URL"
echo ""

# Get a service instance to run commands
echo "🔧 Connecting to Cloud Run instance..."
INSTANCE_ID=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.latestCreatedRevisionName)')

echo "📦 Running database migrations and seed..."
echo ""

# Option 1: Run seed via Cloud Run Jobs
echo "Creating Cloud Run Job for seeding..."
gcloud run jobs create medusa-seed \
  --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
  --region=$REGION \
  --set-cloudsql-instances=maretinda-test:europe-west1:maretinda-test \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest \
  --set-env-vars=NODE_ENV=production \
  --command="sh" \
  --args="-c,cd /app && node /workspace/mercur/node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed.ts" \
  --max-retries=0 \
  2>/dev/null || echo "Job might already exist"

echo ""
echo "🌱 Executing seed job..."
gcloud run jobs execute medusa-seed --region=$REGION --wait

echo ""
echo "👤 Creating admin user..."
echo ""
echo "Admin credentials will be:"
echo "  Email: admin@maretinda.com"
echo "  Password: Maretinda@2025"
echo ""

# Create admin user via API call or another job
gcloud run jobs create medusa-create-admin \
  --image=gcr.io/$PROJECT_ID/maretinda-backend:latest \
  --region=$REGION \
  --set-cloudsql-instances=maretinda-test:europe-west1:maretinda-test \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest \
  --set-env-vars=NODE_ENV=production \
  --command="sh" \
  --args="-c,cd /app && node /workspace/mercur/node_modules/@medusajs/cli/cli.js user -e admin@maretinda.com -p Maretinda@2025" \
  --max-retries=0 \
  2>/dev/null || echo "Job might already exist"

gcloud run jobs execute medusa-create-admin --region=$REGION --wait

echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "🎉 Your Medusa backend is ready:"
echo "  🔗 Backend URL: $SERVICE_URL"
echo "  📊 Admin Panel: $SERVICE_URL/app"
echo "  👤 Login: admin@maretinda.com / Maretinda@2025"
echo ""
echo "🔍 Check the service:"
echo "  curl $SERVICE_URL/health"
echo ""

