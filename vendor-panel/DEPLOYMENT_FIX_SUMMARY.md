# Vendor Panel Deployment Fix Summary

## Issues Fixed

### 1. **Yarn v3 Buildpack Incompatibility**
- **Problem**: Google Cloud Buildpacks tried to use `--modules-folder` flag with Yarn v3, which doesn't support it
- **Solution**: Changed `packageManager` from `yarn@3.2.1` to `yarn@1.22.21` in `package.json`
- **Impact**: Build now works with Google Cloud Buildpacks

### 2. **Browser Auto-Open Error (`xdg-open ENOENT`)**
- **Problem**: Vite preview tried to open a browser in Docker/Cloud Run environment
- **Solution**: 
  - Added `--open false` flag to `start` script
  - Set `BROWSER=none` environment variable
  - Set `CI=true` in Dockerfile to prevent interactive prompts
- **Impact**: No more browser-related errors during deployment

## Files Modified

### `package.json`
```json
{
  "scripts": {
    "start": "BROWSER=none vite preview --host 0.0.0.0 --port 3000 --open false"
  },
  "packageManager": "yarn@1.22.21"
}
```

### `Dockerfile` (New)
- Multi-stage build for optimal image size
- Properly configured environment variables
- Health checks included

### Deployment Files (New)
- `cloudbuild.yaml` - Google Cloud Build configuration
- `deploy.sh` - Deployment script

## Deployment Options

### Option 1: Using Dockerfile (Recommended)

```bash
cd vendor-panel

# Build and deploy using the script
./deploy.sh

# Or manually
docker build -t vendor-panel .
docker run -p 3000:3000 vendor-panel
```

### Option 2: Using Cloud Build

```bash
cd vendor-panel

# Submit to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or trigger from Git
git push origin main
```

### Option 3: Using Buildpacks (Now Fixed)

```bash
cd vendor-panel

# Make sure yarn.lock is regenerated with Yarn v1
rm yarn.lock
yarn install

# Deploy using buildpacks
gcloud run deploy vendor-panel \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

## Environment Variables

Set these during deployment:

```bash
VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app
VITE_MEDUSA_STOREFRONT_URL=https://your-storefront-url.com
VITE_MEDUSA_BASE=/
VITE_MEDUSA_B2B_PANEL=false
NODE_ENV=production
```

## Testing Locally

```bash
# Build the Docker image
docker build \
  --build-arg VITE_MEDUSA_BACKEND_URL="https://maretindatest.medusajs.app" \
  --build-arg VITE_MEDUSA_STOREFRONT_URL="https://your-storefront-url.com" \
  -t vendor-panel .

# Run locally
docker run -p 3000:3000 vendor-panel

# Visit http://localhost:3000
```

## Next Steps

1. **Regenerate yarn.lock** (if using buildpacks):
   ```bash
   cd vendor-panel
   rm yarn.lock
   yarn install
   git add yarn.lock package.json
   git commit -m "fix: use Yarn v1 for buildpack compatibility"
   ```

2. **Update Cloud Build trigger** (if needed):
   - Point to `vendor-panel/cloudbuild.yaml`
   - Set substitution variables for backend/storefront URLs

3. **Deploy**:
   ```bash
   ./deploy.sh
   ```

## Troubleshooting

### If build still fails:
1. Check that `yarn.lock` is regenerated with Yarn v1
2. Verify Docker is installed and running
3. Ensure you have proper GCP permissions

### If deployment succeeds but app doesn't work:
1. Check environment variables are set correctly
2. Verify backend URL is accessible from Cloud Run
3. Check logs: `gcloud run logs read vendor-panel --region=europe-west1`

### Common Errors:
- **"Module not found"**: Rebuild with `yarn install --frozen-lockfile`
- **"Port already in use"**: Change PORT env var or kill existing process
- **CORS errors**: Check backend CORS configuration

## Resources

- [Vite Production Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Yarn v1 Docs](https://classic.yarnpkg.com/en/docs)

