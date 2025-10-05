# 🚨 DEPLOYMENT FAILURE ANALYSIS & SOLUTION

## Root Cause Identified ✅

Your **build succeeds** but **deployment fails** because:

### 1. **Port Configuration Issue** ❌
- **Cloud Run expects**: Port `8080` (via `PORT=8080` env var)  
- **Your app listens on**: Port `9000`
- **Error**: `failed to start and listen on the port defined provided by the PORT=8080`

### 2. **Development Mode in Production** ❌  
- **Buildpack uses**: `yarn run dev` (development server)
- **Should use**: `yarn start` (production server)

### 3. **Missing Peer Dependencies** ⚠️
- All `@mercurjs` modules have unmet peer dependencies
- This causes module resolution failures at runtime

## 🛠️ **IMMEDIATE FIXES NEEDED**

### **Fix 1: Update Environment Variables in Cloud Console**

Go to: https://console.cloud.google.com/run/detail/europe-west1/medusa-backend/variables

**CHANGE THESE VALUES:**
```
❌ BACKEND_URL=http://localhost:9000
✅ BACKEND_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app

❌ FRONTEND_URL=http://localhost:3000  
✅ FRONTEND_URL=https://your-actual-storefront-domain.com

❌ STOREFRONT_URL=http://localhost:3000
✅ STOREFRONT_URL=https://your-actual-storefront-domain.com

❌ VENDOR_PANEL_URL=http://localhost:5173
✅ VENDOR_PANEL_URL=https://your-actual-vendor-domain.com

❌ GIYAPAY_SUCCESS_CALLBACK_URL=http://localhost:9000/giyapay/success
✅ GIYAPAY_SUCCESS_CALLBACK_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app/giyapay/success

❌ GIYAPAY_ERROR_CALLBACK_URL=http://localhost:9000/giyapay/error  
✅ GIYAPAY_ERROR_CALLBACK_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app/giyapay/error

❌ GIYAPAY_CANCEL_CALLBACK_URL=http://localhost:9000/giyapay/cancel
✅ GIYAPAY_CANCEL_CALLBACK_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app/giyapay/cancel

❌ DATABASE_URL=postgres://postgres:169831@localhost:5432/$DB_NAME
✅ DATABASE_URL=postgres://username:password@/database_name?host=/cloudsql/maretinda-test:europe-west1:maretinda-test
```

**ADD MISSING VARIABLES:**
```
NODE_ENV=production
PORT=8080
```

**REMOVE THESE (not needed in production):**
```
❌ REDIS_URL=redis://localhost:6379
❌ DB_NAME=finalmaretinda  
```

### **Fix 2: Force Redeploy with Correct Configuration**

```bash
gcloud run deploy medusa-backend \
    --image=europe-west1-docker.pkg.dev/maretinda-test/cloud-run-source-deploy/maretinda_main/medusa-backend:e20342ade816331fa03727815d206c3753a68aad \
    --region=europe-west1 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=2Gi \
    --cpu=2 \
    --port=8080 \
    --timeout=900 \
    --set-cloudsql-instances=maretinda-test:europe-west1:maretinda-test \
    --set-env-vars=NODE_ENV=production,PORT=8080,GOOGLE_ENTRYPOINT="yarn start"
```

## 🎯 **Step-by-Step Action Plan**

### **Step 1: Fix Environment Variables (CRITICAL)**
1. Go to Cloud Console: https://console.cloud.google.com/run/detail/europe-west1/medusa-backend/variables
2. Update all `localhost` URLs to your actual service URL
3. Add `NODE_ENV=production` and `PORT=8080`
4. Remove `REDIS_URL` if you're not using Redis

### **Step 2: Fix Database Connection**
Your current `DATABASE_URL` points to localhost. You need the actual Cloud SQL connection string.

**Find your Cloud SQL instance:**
```bash
gcloud sql instances describe maretinda-test --format="value(connectionName)"
```

**Update DATABASE_URL to:**
```
postgres://your-db-user:your-db-password@/your-db-name?host=/cloudsql/maretinda-test:europe-west1:maretinda-test
```

### **Step 3: Redeploy**
```bash
./fix-cloud-run.sh redeploy
```

### **Step 4: Test the Service**
```bash
curl https://medusa-backend-yi6mw2mlka-ew.a.run.app/health
```

### **Step 5: Run Seed Scripts (After Deployment Works)**
```bash
./fix-cloud-run.sh seed
./fix-cloud-run.sh admin
```

## 🔧 **Alternative: Quick Fix Script**

I'll create a script that fixes all environment variables at once:

```bash
# Run this to fix all environment variables
./fix-cloud-run.sh fix-env-production
```

The main issue is that your environment variables are all pointing to `localhost` which doesn't exist in the Cloud Run container. Once you update these to use the actual service URLs and proper database connection, your deployment should work.

**Priority**: Fix the environment variables first, then redeploy. The build itself is working fine!
