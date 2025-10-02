#!/bin/bash

# Setup GitHub Integration for GCP Cloud Build
# This script connects your GitHub repository to Google Cloud Build

set -e

PROJECT_ID="maretinda-test"
REGION="europe-west1"
REPO_OWNER="BIMS-Tech"
REPO_NAME="Maretinda_Main"

echo "🔧 Setting up GitHub integration for GCP Cloud Build..."
echo ""

# Set project
gcloud config set project $PROJECT_ID

echo "📋 Step 1: Connect GitHub Repository"
echo "-------------------------------------"
echo "You need to manually connect GitHub in the GCP Console:"
echo "1. Go to: https://console.cloud.google.com/cloud-build/triggers"
echo "2. Click 'CONNECT REPOSITORY'"
echo "3. Select 'GitHub'"
echo "4. Authenticate and select repository: $REPO_OWNER/$REPO_NAME"
echo "5. Click 'CONNECT'"
echo ""
read -p "Press Enter after you've connected the repository..."

echo ""
echo "📋 Step 2: Create Build Trigger"
echo "--------------------------------"
echo "Creating automated trigger for main branch..."

gcloud builds triggers create github \
  --name="maretinda-backend-deploy" \
  --repo-name="$REPO_NAME" \
  --repo-owner="$REPO_OWNER" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --description="Auto-deploy Medusa backend on push to main" \
  --region="$REGION" \
  2>/dev/null || echo "ℹ️  Trigger might already exist"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Commit your changes: git add . && git commit -m 'Add GCP deployment config'"
echo "2. Push to GitHub: git push origin main"
echo "3. Cloud Build will automatically deploy to Cloud Run"
echo ""
echo "📊 Monitor deployment:"
echo "  - Builds: https://console.cloud.google.com/cloud-build/builds"
echo "  - Cloud Run: https://console.cloud.google.com/run"
echo ""

