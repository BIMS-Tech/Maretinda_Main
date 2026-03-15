#!/bin/bash

# Maretinda Storefront Deployment Script
# This script deploys the storefront using Docker to avoid buildpack issues

set -e

echo "🚀 Deploying Maretinda Storefront to Google Cloud Run..."

# Configuration
PROJECT_ID=${PROJECT_ID:-"maretinda-test"}
REGION=${REGION:-"europe-west1"}
SERVICE_NAME=${SERVICE_NAME:-"maretinda-storefront"}

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Name: $SERVICE_NAME"

# Deploy using Docker (bypasses buildpack issues)
echo "🐳 Deploying with Docker..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --use-dockerfile \
  --project $PROJECT_ID

echo "✅ Deployment completed!"
echo "🌐 Your storefront should be available at:"
gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)'

