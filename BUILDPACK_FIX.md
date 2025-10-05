# 🚨 DEPLOYMENT ERROR SOLUTION

## Root Cause
Your deployment is using **Google Cloud Buildpacks** which:
1. **Runs in development mode** (`yarn dev` instead of `yarn start`)
2. **Doesn't build the `@mercurjs` packages** properly
3. **Missing module resolution** for custom packages

## 🛠️ **Solution: Fix the Buildpack Configuration**

### Option 1: Add `.buildpacks` file to force production mode

Create a `.buildpacks` file in your repo root:

```
https://github.com/GoogleCloudPlatform/buildpacks.git#google.nodejs.runtime
https://github.com/GoogleCloudPlatform/buildpacks.git#google.nodejs.yarn
```

### Option 2: Add environment variables to force production

Add these to your `mercur/apps/backend/package.json`:

```json
{
  "scripts": {
    "start": "medusa start --types=false",
    "build": "yarn build:packages && medusa build",
    "build:packages": "cd ../../packages && yarn build:all",
  },
  "engines": {
    "node": "20.x"
  }
}
```

### Option 3: Switch to Custom Dockerfile (RECOMMENDED)

Update your `cloudbuild.yaml` to use your custom Dockerfile instead of buildpacks:

```yaml
steps:
  # Build all packages first
  - name: 'node:20'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        cd mercur
        yarn install
        yarn build
    id: 'build-packages'

  # Build the backend Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/maretinda-backend:$SHORT_SHA'
      - '-f'
      - 'gcp-deployment/backend-prebuilt-local.Dockerfile'
      - '.'
    id: 'build-backend'
    waitFor: ['build-packages']
```

## 🚀 **Quick Fix (Immediate)**

1. **Add a `.gcloudignore` file** to your repo root:
```
node_modules/
.git/
.gitignore
*.md
```

2. **Add environment variable to force production**:
```bash
gcloud run services update medusa-backend \
    --region=europe-west1 \
    --set-env-vars=NODE_ENV=production,GOOGLE_ENTRYPOINT="yarn start"
```

3. **Trigger a new build**:
```bash
# Push a small change to trigger rebuild
git commit --allow-empty -m "Force rebuild with production mode"
git push origin main
```

## 🎯 **The Real Fix**

The issue is that buildpacks detect your `package.json` and automatically run `yarn dev` because it thinks it's a development environment. 

**Add this to your `mercur/apps/backend/package.json`:**

```json
{
  "scripts": {
    "start": "medusa start --types=false",
    "build": "medusa build",
    "postinstall": "medusa build"
  },
  "engines": {
    "node": "20"
  }
}
```

This will force the buildpack to:
1. Run `yarn build` after install
2. Use `yarn start` in production
3. Build the Medusa application properly

**Then push to trigger a new deployment:**
```bash
git add .
git commit -m "Fix production deployment configuration"
git push origin main
```
