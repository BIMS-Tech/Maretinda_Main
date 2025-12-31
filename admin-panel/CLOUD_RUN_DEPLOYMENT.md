# Admin Panel - Cloud Run Deployment Guide

## 🚀 Automated Deployment via GitHub

Your admin panel is set up for automatic deployment to Google Cloud Run via Cloud Build.

## ✅ Fixes Applied

### 1. Updated Dockerfile

- ✅ Multi-stage build for optimization
- ✅ Accepts build arguments for Vite environment variables
- ✅ Properly builds production bundle with environment variables baked in
- ✅ Serves on port 3000 (not 5173)
- ✅ Includes health checks

### 2. Updated cloudbuild.yaml

- ✅ Passes environment variables as build arguments
- ✅ Builds with correct backend URL
- ✅ Deploys to Cloud Run with proper configuration
- ✅ Uses substitutions for easy configuration

## 📝 Configuration

### Update cloudbuild.yaml Substitutions

Edit `admin-panel/cloudbuild.yaml` and update these values:

```yaml
substitutions:
  _SERVICE: 'maretinda-admin-panel-test'  # Your Cloud Run service name
  _REGION: 'europe-west1'                  # Your region
  _GAR_LOCATION: 'europe-west1'            # Artifact Registry location
  _BACKEND_URL: 'https://maretindatest.medusajs.app'  # Your Medusa backend URL
  _STOREFRONT_URL: 'https://your-storefront-url.com'  # Your storefront URL
```

## 🔧 Setup Steps

### 1. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### 2. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=europe-west1 \
  --description="Docker repository for Cloud Run deployments"
```

### 3. Grant Cloud Build Permissions

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant Cloud Run Admin role to Cloud Build
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud iam service-accounts add-iam-policy-binding \
  ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 4. Connect GitHub Repository

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **"Create Trigger"**
3. Select **"GitHub"** as source
4. Authenticate and select your repository
5. Configure trigger:
   - **Name**: `admin-panel-deploy`
   - **Event**: Push to branch
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file
   - **Location**: `admin-panel/cloudbuild.yaml`
6. Click **"Create"**

## 🚀 Deployment Process

### Automatic Deployment

Every push to the `main` branch triggers:

1. ✅ Cloud Build starts automatically
2. ✅ Docker image built with environment variables
3. ✅ Image pushed to Artifact Registry
4. ✅ Deployed to Cloud Run
5. ✅ Service automatically updated

### Manual Deployment

```bash
cd admin-panel

# Submit build manually
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_BACKEND_URL="https://maretindatest.medusajs.app",_STOREFRONT_URL="https://yourdomain.com"
```

## 🔍 Verify Deployment

### Check Build Status

```bash
# List recent builds
gcloud builds list --limit=5

# View specific build logs
gcloud builds log BUILD_ID
```

### Check Cloud Run Service

```bash
# Get service details
gcloud run services describe maretinda-admin-panel-test --region=europe-west1

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50
```

### Test the Service

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe maretinda-admin-panel-test --region=europe-west1 --format="value(status.url)")

# Test health
curl $SERVICE_URL

# Open in browser
open $SERVICE_URL
```

## 🐛 Troubleshooting

### Build Fails: "No space left on device"

Increase machine type in cloudbuild.yaml:
```yaml
options:
  machineType: 'E2_HIGHCPU_8'
```

### Build Timeout

Increase timeout in cloudbuild.yaml:
```yaml
options:
  timeout: '1800s'  # 30 minutes
```

### Startup Probe Failed

The error you saw (`DEADLINE_EXCEEDED`) means the app took too long to start.

**Fixed by:**
- ✅ Proper multi-stage build (faster startup)
- ✅ Serving pre-built files (not dev server)
- ✅ Correct port configuration (3000, not 5173)

### Environment Variables Not Working

Make sure they're passed as build arguments:
```yaml
--build-arg VITE_MEDUSA_BACKEND_URL=https://your-backend.com
```

### CORS Errors

Update your backend's CORS configuration:
```env
# backend/.env
ADMIN_CORS=https://maretinda-admin-panel-test-xxx.run.app
```

## 📊 Monitoring

### Set Up Alerts

```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Admin Panel High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

### View Metrics

- Go to [Cloud Run Console](https://console.cloud.google.com/run)
- Select your service
- View: Request count, Latency, Errors, Memory, CPU

## 🔐 Production Best Practices

### 1. Use Secret Manager for Sensitive Data

```bash
# Store API keys in Secret Manager
echo -n "your-secret-value" | gcloud secrets create admin-api-key --data-file=-

# Update cloudbuild.yaml to use secrets
--set-secrets=API_KEY=admin-api-key:latest
```

### 2. Enable Cloud Armor

```bash
# Protect against DDoS
gcloud compute security-policies create admin-panel-policy \
  --description="Security policy for admin panel"
```

### 3. Set Up CDN

```bash
# Enable CDN for faster static asset delivery
gcloud compute backend-services update admin-panel-backend \
  --enable-cdn
```

### 4. Custom Domain

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=maretinda-admin-panel-test \
  --domain=admin.yourdomain.com \
  --region=europe-west1
```

## 📝 Deployment Checklist

Before production deployment:

- [ ] Updated `_BACKEND_URL` in cloudbuild.yaml
- [ ] Updated `_STOREFRONT_URL` in cloudbuild.yaml
- [ ] Cloud Build trigger configured
- [ ] Artifact Registry repository created
- [ ] IAM permissions granted to Cloud Build
- [ ] Backend CORS includes admin panel URL
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Health checks passing
- [ ] SSL certificate active

## 🎯 Cost Optimization

### Current Configuration

```yaml
--memory 2Gi      # $0.0000025 per GB-second
--cpu 2           # $0.00002400 per vCPU-second
--min-instances 0 # Scale to zero when idle
--max-instances 10
```

**Estimated cost**: $10-30/month (depending on usage)

### Reduce Costs

1. **Scale to zero**: Already configured
2. **Lower memory/CPU for low traffic**:
   ```yaml
   --memory 1Gi
   --cpu 1
   ```
3. **Use Cloud Run revisions**: Deploy to specific revisions for testing

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)

## ✅ Summary

Your admin panel is now configured for automatic deployment with:

- ✅ Optimized multi-stage Docker build
- ✅ Environment variables baked into build
- ✅ Proper port configuration (3000)
- ✅ Health checks
- ✅ Auto-scaling
- ✅ GitHub integration

**Next**: Push to main branch and watch it deploy automatically! 🚀

---

**Last Updated**: 2025-12-31  
**Status**: ✅ Ready for Deployment

