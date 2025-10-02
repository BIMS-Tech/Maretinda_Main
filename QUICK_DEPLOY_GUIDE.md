# 🚀 Quick Deployment Guide

## ✅ Your Local Setup (Working Now!)

**Admin Panel:** http://localhost:9000/app  
**Login:** `admin@medusa-test.com` / `supersecret`

---

## 🔗 GCP Deployment via GitHub

### One-Time Setup

1. **Connect GitHub to Cloud Build:**
   - Go to: https://console.cloud.google.com/cloud-build/triggers?project=maretinda-test
   - Click **"CONNECT REPOSITORY"**
   - Select **"GitHub (Cloud Build GitHub App)"**
   - Authenticate and select: **`BIMS-Tech/Maretinda_Main`**
   - Click **"CONNECT"**

2. **Create Build Trigger:**
   - Click **"CREATE TRIGGER"**
   - Name: `maretinda-backend-deploy`
   - Event: **Push to a branch**
   - Branch: `^main$`
   - Configuration: **Cloud Build configuration file**
   - Location: `/cloudbuild.yaml`
   - Click **"CREATE"**

### Deploy

**Automatic:** Just push to main branch
```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Manual:** Run the trigger
```bash
# In GCP Console, click "RUN" on the trigger
```

---

## 📊 Monitoring

**View Builds:**
```bash
gcloud builds list --limit=5
```

**View Service:**
```bash
gcloud run services describe maretinda-backend --region=europe-west1
```

**View Logs:**
```bash
gcloud run services logs read maretinda-backend --region=europe-west1 --limit=50
```

**Cloud Console:**
- Builds: https://console.cloud.google.com/cloud-build/builds?project=maretinda-test
- Cloud Run: https://console.cloud.google.com/run?project=maretinda-test

---

## 🔧 Configuration

### Cloud Run Settings
- **Memory:** 2Gi
- **CPU:** 2
- **Port:** 9000
- **Timeout:** 900s
- **Min Instances:** 0
- **Max Instances:** 10

### Secrets (Already configured in Secret Manager)
✅ DATABASE_URL  
✅ JWT_SECRET  
✅ COOKIE_SECRET  
✅ STRIPE_SECRET_API_KEY  
✅ ALGOLIA_API_KEY  
✅ ALGOLIA_APP_ID  
✅ RESEND_API_KEY  

---

## ⚡ Quick Actions

**Update deployment:**
```bash
git push origin main  # Automatically triggers build & deploy
```

**Check latest deployment:**
```bash
gcloud builds list --limit=1
```

**Get service URL:**
```bash
gcloud run services describe maretinda-backend --region=europe-west1 --format='value(status.url)'
```

**Rollback to previous version:**
```bash
gcloud run services update-traffic maretinda-backend --to-revisions=PREVIOUS_REVISION=100 --region=europe-west1
```

---

## 📁 Files Created

- `cloudbuild.yaml` - Cloud Build configuration
- `gcp-deployment/backend-prebuilt-local.Dockerfile` - Production Dockerfile
- `.gcloudignore` - Files to exclude from build
- `DEPLOYMENT_README.md` - Full deployment documentation
- `setup-github-deployment.sh` - Setup helper script

---

## 💡 Tips

1. **Build locally first:** Run `npm run build` in `mercur/apps/backend` before pushing
2. **Check secrets:** Ensure all secrets are set in Secret Manager
3. **Monitor builds:** First build takes ~10-15 minutes
4. **Update secrets:** Use `gcloud secrets versions add SECRET_NAME --data-file=-`

---

## 🆘 Troubleshooting

**Build fails:**
- Check build logs in Cloud Console
- Verify all files are in GitHub
- Ensure `.medusa` directory is built locally

**Service doesn't start:**
- Check Cloud Run logs
- Verify DATABASE_URL secret
- Check memory/CPU limits

**Timeout during build:**
- Builds from GitHub don't have upload limits
- Check Cloud Build logs for actual error

---

**Need help?** Check the full docs in `DEPLOYMENT_README.md`

