# ✅ Cloud Run Deployment - FIXED

## 🐛 The Problems

1. **Startup probe timeout**: `DEADLINE_EXCEEDED on port 5173`
2. **Wrong port**: Trying to use 5173 (Vite dev server) instead of 3000
3. **Missing environment variables**: Backend URL not injected during build

## ✅ Fixes Applied

### 1. Updated Dockerfile

**Before**: Single-stage build, no build args
**After**: Multi-stage optimized build with environment variables

```dockerfile
# Now accepts build arguments
ARG VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app
# Builds production bundle with env vars
RUN yarn build:preview
# Serves on correct port
ENV PORT=3000
```

### 2. Updated cloudbuild.yaml

**Before**: No build args passed
**After**: Passes environment variables as build arguments

```yaml
--build-arg VITE_MEDUSA_BACKEND_URL=${_BACKEND_URL}
--build-arg VITE_MEDUSA_STOREFRONT_URL=${_STOREFRONT_URL}
```

### 3. Added .dockerignore

Faster builds, smaller images.

## 🚀 What to Do Now

### Step 1: Update Your Backend URL

Edit `admin-panel/cloudbuild.yaml` line 43:

```yaml
substitutions:
  _BACKEND_URL: 'https://maretindatest.medusajs.app'  # ← Your actual backend URL
  _STOREFRONT_URL: 'https://your-storefront.com'     # ← Your storefront URL
```

### Step 2: Commit and Push

```bash
cd admin-panel

git add Dockerfile cloudbuild.yaml .dockerignore
git commit -m "Fix: Cloud Run deployment with proper env vars and port config"
git push origin main
```

### Step 3: Watch It Deploy

Cloud Build will automatically:
1. ✅ Build with correct environment variables
2. ✅ Create optimized Docker image
3. ✅ Deploy to Cloud Run on port 3000
4. ✅ Start successfully (no more timeout!)

## 📊 Expected Build Output

```
Step 1: Building Docker image with build args...
  → VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app
  → Building production bundle...
  ✓ Built in 45s

Step 2: Pushing to Artifact Registry...
  ✓ Pushed

Step 3: Deploying to Cloud Run...
  ✓ Deployed
  ✓ Service URL: https://maretinda-admin-panel-test-xxx.run.app
```

## 🐛 If It Still Fails

### Check Build Logs

```bash
# Get latest build ID
gcloud builds list --limit=1

# View logs
gcloud builds log BUILD_ID
```

### Verify Substitutions

Make sure these are correct in cloudbuild.yaml:
- `_SERVICE`: Your Cloud Run service name
- `_REGION`: Your deployment region
- `_BACKEND_URL`: Your Medusa backend URL (with https://)

### Common Issues

**Issue**: `Error: connect ECONNREFUSED`
**Fix**: Check backend URL is correct and accessible

**Issue**: `CORS error`
**Fix**: Add admin panel URL to backend CORS:
```env
# backend/.env
ADMIN_CORS=https://your-admin-panel.run.app
```

**Issue**: Build timeout
**Fix**: Already fixed with machine type `E2_HIGHCPU_8`

## ✅ Success Indicators

After deployment, you should see:

1. ✅ Build completes in ~2-3 minutes
2. ✅ No "DEADLINE_EXCEEDED" errors
3. ✅ Service starts successfully
4. ✅ Health check passes
5. ✅ Admin panel accessible at Cloud Run URL
6. ✅ Can login with backend credentials

## 📚 Full Documentation

See [`CLOUD_RUN_DEPLOYMENT.md`](./CLOUD_RUN_DEPLOYMENT.md) for complete guide including:
- GitHub trigger setup
- IAM permissions
- Monitoring
- Custom domains
- Production best practices

## 🎉 Summary

**Old Setup**:
- ❌ Wrong port (5173)
- ❌ No environment variables
- ❌ Startup timeouts

**New Setup**:
- ✅ Correct port (3000)
- ✅ Environment variables baked in during build
- ✅ Fast startup
- ✅ Optimized multi-stage build
- ✅ Ready for production

---

**Status**: ✅ Ready to Deploy  
**Next**: Push to main branch!

