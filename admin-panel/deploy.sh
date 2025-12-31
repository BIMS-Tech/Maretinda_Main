#!/bin/bash

# Admin Panel Deployment Script
set -e

# Configuration
PROJECT_ID="maretinda-test"
SERVICE_NAME="maretinda-admin-panel-test"
REGION="europe-west1"
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME"
BACKEND_URL="https://maretindatest.medusajs.app"
STOREFRONT_URL="https://your-storefront-url.com"

echo "🚀 Deploying Admin Panel to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Backend URL: $BACKEND_URL"

# Build Docker image with build arguments
echo "📦 Building Docker image..."
docker build \
  --build-arg VITE_MEDUSA_BACKEND_URL="$BACKEND_URL" \
  --build-arg VITE_MEDUSA_STOREFRONT_URL="$STOREFRONT_URL" \
  --build-arg VITE_MEDUSA_BASE="/" \
  --build-arg VITE_MEDUSA_B2B_PANEL="false" \
  -t "$IMAGE_NAME:latest" .

# Push to Artifact Registry
echo "📤 Pushing image to registry..."
docker push "$IMAGE_NAME:latest"

# Deploy to Cloud Run - REMOVE PORT ENV VAR
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME:latest" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300 \
  --clear-env-vars \
  --set-env-vars "NODE_ENV=production" \
  --project "$PROJECT_ID"

echo "✅ Deployment complete!"
echo "🌐 Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"




