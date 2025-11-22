# Maretinda Storefront Deployment Guide

## GitHub Actions Deployment (Recommended)

### Prerequisites
1. **Google Cloud Project** with Cloud Run API enabled
2. **Service Account** with the following roles:
   - Cloud Run Admin
   - Storage Admin
   - Artifact Registry Admin

### Setup Steps

#### 1. Create Service Account
```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --description="GitHub Actions deployment" \
    --display-name="GitHub Actions"

# Add required roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### 2. GitHub Secrets
Add these secrets to your GitHub repository:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_SA_KEY`: Contents of the `key.json` file (entire JSON)

#### 3. Deploy
Push to the `main` branch or manually trigger the workflow. The deployment will:
1. Build the Docker image
2. Push to Google Artifact Registry
3. Deploy to Cloud Run
4. Provide the service URL

### Manual Deployment

If you prefer to deploy manually:

```bash
cd b2c-marketplace-storefront

# Build and deploy
gcloud run deploy maretinda-storefront \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --use-dockerfile
```

### Environment Variables

Set these in Cloud Run:
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend-url`

### Troubleshooting

1. **Container fails to start**: Check logs in Google Cloud Console
2. **Port issues**: Ensure the app listens on port 3000
3. **Build failures**: Check GitHub Actions logs
4. **Permission errors**: Verify service account roles

### Health Check

The app includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "maretinda-storefront"
}
```

