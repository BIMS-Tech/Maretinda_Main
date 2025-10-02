# Maretinda Deployment Guide

## 🎯 Current Status

### ✅ Working Locally
- **Backend & Admin Panel:** http://localhost:9000/app
- **Login:** `admin@medusa-test.com` / `supersecret`
- **Database:** PostgreSQL (finalmaretinda)
- **All Features:** Fully functional

---

## 🚀 GitHub-Based GCP Deployment

### Prerequisites
1. Code pushed to GitHub: `BIMS-Tech/Maretinda_Main`
2. GCP Project: `maretinda-test`
3. Cloud SQL instance: `maretinda-test`
4. Secrets configured in Secret Manager

### Setup GitHub Integration

#### Step 1: Connect GitHub to Cloud Build
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers?project=maretinda-test)
2. Click **"CONNECT REPOSITORY"**
3. Select **"GitHub (Cloud Build GitHub App)"**
4. Authenticate with your GitHub account
5. Select repository: **`BIMS-Tech/Maretinda_Main`**
6. Click **"CONNECT"**

#### Step 2: Create Build Trigger
Run this command:
```bash
gcloud builds triggers create github \
  --name="maretinda-backend-deploy" \
  --repo-name="Maretinda_Main" \
  --repo-owner="BIMS-Tech" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region="europe-west1"
```

Or create manually in the console:
- **Name:** `maretinda-backend-deploy`
- **Event:** Push to branch
- **Branch:** `^main$`
- **Configuration:** Cloud Build configuration file
- **Location:** `/cloudbuild.yaml`

### Step 3: Deploy

Once the trigger is set up, every push to `main` branch will:
1. ✅ Clone code from GitHub
2. ✅ Build Docker image in Cloud Build
3. ✅ Push to Container Registry
4. ✅ Deploy to Cloud Run

**Manual deployment:**
```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## 📊 Monitoring

- **Builds:** https://console.cloud.google.com/cloud-build/builds?project=maretinda-test
- **Cloud Run:** https://console.cloud.google.com/run?project=maretinda-test
- **Logs:** `gcloud run services logs read maretinda-backend --region=europe-west1`

---

## 🔧 Configuration

### Environment Variables (Set in Cloud Run)
- `NODE_ENV=production`
- `ADMIN_CORS=*`
- `STORE_CORS=*`
- `VENDOR_CORS=*`
- `AUTH_CORS=*`

### Secrets (From Secret Manager)
- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `STRIPE_SECRET_API_KEY`
- `STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET`
- `ALGOLIA_API_KEY`
- `ALGOLIA_APP_ID`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

---

## ⚠️ Known Issues

### Docker Local Deployment
- **Issue:** Module linkable properties not available in Docker production mode
- **Affected:** Link files (category-attribute.ts, customer-review.ts, etc.)
- **Status:** Works perfectly in local development mode
- **Workaround:** Use local development setup or fix link definitions

### File Upload Size
- **Issue:** Large monorepo (1.5GB+) causes upload timeouts
- **Solution:** GitHub integration (Cloud Build clones from Git)

---

## 📝 Notes

- The Dockerfile uses **pre-built .medusa directory** from local build
- Build happens on your machine, then Docker image is deployed
- For best results, run `npm run build` in `mercur/apps/backend` before pushing
- GitHub-based deployment avoids upload timeout issues

---

## 🎯 Quick Commands

**Push and deploy:**
```bash
git add .
git commit -m "Your changes"
git push origin main
# Cloud Build automatically deploys
```

**Check deployment status:**
```bash
gcloud builds list --limit=5
gcloud run services describe maretinda-backend --region=europe-west1
```

**View logs:**
```bash
gcloud run services logs read maretinda-backend --region=europe-west1 --limit=50
```

