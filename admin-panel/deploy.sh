#!/bin/bash

# Admin Panel Deployment Script
set -e

# Configuration
PROJECT_ID="maretinda-test"
SERVICE_NAME="maretinda-admin"
REGION="europe-west1"
IMAGE_NAME="$REGION-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/$SERVICE_NAME"

echo "🚀 Deploying Admin Panel to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"

# Build Docker image
echo "📦 Building Docker image..."
docker build -t "$IMAGE_NAME:latest" .

# Push to Google Container Registry
echo "📤 Pushing image to registry..."
docker push "$IMAGE_NAME:latest"

# Deploy to Cloud Run
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
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,PORT=3000,HOST=0.0.0.0" \
  --project "$PROJECT_ID"

echo "✅ Deployment complete!"
echo "🌐 Service URL: https://$SERVICE_NAME-$REGION.run.app"




