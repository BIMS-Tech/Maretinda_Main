#!/bin/bash

# Fix Cloud Run Service Configuration - QUICK FIX for PORT issue
set -e

# Configuration
PROJECT_ID="maretinda-test"
SERVICE_NAME="maretinda-main"
REGION="europe-west1"

echo "🔧 Fixing Cloud Run service port issue: $SERVICE_NAME"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""
echo "Issue: Service has PORT=5173 set, but container serves on port 3000"
echo "Fix: Clearing env vars and setting PORT=3000"
echo ""

# Update the service to use correct port and environment variables
echo "📝 Updating service configuration..."
gcloud run services update "$SERVICE_NAME" \
  --region "$REGION" \
  --port 3000 \
  --clear-env-vars \
  --set-env-vars "NODE_ENV=production,PORT=3000,BROWSER=none,CI=true" \
  --project "$PROJECT_ID"

echo ""
echo "✅ Service configuration updated!"
echo ""
echo "⚠️  IMPORTANT: You still need to redeploy with the fixed Docker image"
echo ""
echo "📋 Choose one deployment method:"
echo ""
echo "  Option 1 - Using deploy script:"
echo "    ./deploy.sh"
echo ""
echo "  Option 2 - Using Cloud Build:"
echo "    gcloud builds submit --config cloudbuild.yaml"
echo ""
echo "🌐 Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)' 2>/dev/null || echo 'N/A')"

