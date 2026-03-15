# Cloud Run Port Issue - Fixed ✅

## The Problem

Your vendor panel deployment was failing with:
```
ERROR: The user-provided container failed to start and listen on the port defined provided by the PORT=5173 environment variable
Default STARTUP TCP probe failed 1 time consecutively for container "placeholder-1" on port 5173
```

## Root Causes

1. **Wrong PORT environment variable**: Service `maretinda-main` had `PORT=5173` (Vite dev port) instead of `PORT=3000` (production port)
2. **Browser auto-open issue**: Vite tried to open `xdg-open` in Docker (no display available)
3. **Yarn v3 compatibility**: Buildpacks couldn't handle Yarn v3's syntax

## Fixes Applied ✅

### 1. **cloudbuild.yaml**
- Added `--clear-env-vars` to remove old PORT setting
- Set correct environment variables: `PORT=3000,BROWSER=none,CI=true`
- Changed service name to `maretinda-main` (actual service name)

### 2. **deploy.sh**
- Updated service name to `maretinda-main`
- Added `PORT=3000` to env vars
- Added browser prevention flags

### 3. **package.json**
- Changed `yarn@3.2.1` → `yarn@1.22.21`
- Added `start` script with `--open false` flag

### 4. **Dockerfile**
- Added `ENV PORT=3000`
- Added `ENV BROWSER=none`
- Added `ENV CI=true`

## Deploy Now 🚀

### Option 1: Quick Deploy (Recommended)
```bash
cd vendor-panel
gcloud builds submit --config cloudbuild.yaml
```

### Option 2: Local Build + Deploy
```bash
cd vendor-panel
./deploy.sh
```

### Option 3: Just Fix Service Config (No Redeploy)
```bash
cd vendor-panel
./fix-cloud-run-service.sh
```

## What Each File Does

| File | Purpose |
|------|---------|
| `cloudbuild.yaml` | Google Cloud Build configuration |
| `deploy.sh` | Local deployment script |
| `Dockerfile` | Container image definition |
| `fix-cloud-run-service.sh` | Quick fix for existing service config |

## Verification

After deployment, check:

1. **Service is running**:
   ```bash
   gcloud run services describe maretinda-main --region=europe-west1
   ```

2. **Port is correct** (should be 3000):
   ```bash
   gcloud run services describe maretinda-main \
     --region=europe-west1 \
     --format="value(spec.template.spec.containers[0].ports[0].containerPort)"
   ```

3. **Environment variables are set**:
   ```bash
   gcloud run services describe maretinda-main \
     --region=europe-west1 \
     --format="yaml(spec.template.spec.containers[0].env)"
   ```

## Expected Output

You should see:
- ✅ Container Port: `3000`
- ✅ Environment Variables:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `BROWSER=none`
  - `CI=true`

## Logs

Check logs after deployment:
```bash
gcloud run logs read maretinda-main --region=europe-west1 --limit=50
```

You should NOT see:
- ❌ `Error: spawn xdg-open ENOENT`
- ❌ `port 5173`
- ❌ `--modules-folder` errors

## Troubleshooting

### If deployment still fails:

1. **Clear the service and redeploy**:
   ```bash
   gcloud run services delete maretinda-main --region=europe-west1
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Check Docker image builds locally**:
   ```bash
   docker build -t vendor-panel-test .
   docker run -p 3000:3000 vendor-panel-test
   # Visit http://localhost:3000
   ```

3. **Verify yarn.lock is for Yarn v1**:
   ```bash
   cd vendor-panel
   rm yarn.lock
   yarn install
   git add yarn.lock
   git commit -m "fix: regenerate yarn.lock with v1"
   ```

## Service Details

- **Service Name**: `maretinda-main`
- **Region**: `europe-west1`
- **Project**: `maretinda-test`
- **Port**: `3000`
- **Memory**: `2Gi`
- **CPU**: `2`
- **Timeout**: `3600s` (1 hour)

## Next Deployment

For future deployments, just run:
```bash
cd vendor-panel
gcloud builds submit --config cloudbuild.yaml
```

All the fixes are now permanent in the configuration files! 🎉

