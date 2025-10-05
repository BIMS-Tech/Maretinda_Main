# 🚨 Cloud Run Deployment Issues & Solutions

## Current Problems Identified

### 1. **Missing Environment Variables** ❌
Your Cloud Run service has **zero environment variables** set. The `.env` files in your local monorepo don't automatically transfer to Cloud Run.

### 2. **Missing @mercurjs Modules** ❌  
Error: `Cannot find module '@mercurjs/seller/dist/index.js'`
The custom modules from your monorepo packages aren't properly built/linked in the Docker container.

### 3. **Service Name Mismatch** ❌
Your actual service is `medusa-backend`, not `maretinda-backend`.

## 🛠️ **Step-by-Step Fix**

### **Step 1: Set Environment Variables in Google Cloud Console**

Go to: https://console.cloud.google.com/run/detail/europe-west1/medusa-backend/variables

**Set these Environment Variables:**
```
NODE_ENV=production
ADMIN_CORS=*
STORE_CORS=*
VENDOR_CORS=*
AUTH_CORS=*
```

**Set these Secrets (from Secret Manager):**
```
DATABASE_URL
JWT_SECRET
COOKIE_SECRET
STRIPE_SECRET_API_KEY
STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET
ALGOLIA_API_KEY
ALGOLIA_APP_ID
RESEND_API_KEY
RESEND_FROM_EMAIL
```

**Optional (for GiyaPay):**
```
GIYAPAY_MERCHANT_ID
GIYAPAY_MERCHANT_SECRET
GIYAPAY_SANDBOX_MODE=true
```

### **Step 2: Fix the Docker Build**

The issue is that your `@mercurjs` packages need to be properly built. Update your build process:

```bash
# In your local mercur directory, build all packages first
cd mercur
yarn build

# Then rebuild and push the Docker image
gcloud builds submit --config=../cloudbuild.yaml
```

### **Step 3: Use the Fix Script**

```bash
# Check current status
./fix-cloud-run.sh check

# Guide to fix environment variables  
./fix-cloud-run.sh fix-env

# Redeploy with correct settings
./fix-cloud-run.sh redeploy

# After deployment is successful, seed the database
./fix-cloud-run.sh seed

# Create admin user
./fix-cloud-run.sh admin
```

## 🔧 **Alternative: Manual Deployment Fix**

If the script doesn't work, manually redeploy:

```bash
gcloud run deploy medusa-backend \
    --image=gcr.io/maretinda-test/maretinda-backend:latest \
    --region=europe-west1 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=2Gi \
    --cpu=2 \
    --port=9000 \
    --timeout=900 \
    --set-cloudsql-instances=maretinda-test:europe-west1:maretinda-test \
    --set-env-vars=NODE_ENV=production,ADMIN_CORS=*,STORE_CORS=*,VENDOR_CORS=*,AUTH_CORS=* \
    --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,COOKIE_SECRET=COOKIE_SECRET:latest
```

## 🎯 **Your Service URLs**

After fixing:
- **Service**: https://medusa-backend-908343727691.europe-west1.run.app
- **Admin Panel**: https://medusa-backend-908343727691.europe-west1.run.app/app  
- **Vendor Panel**: https://medusa-backend-908343727691.europe-west1.run.app/vendor
- **API Docs**: https://medusa-backend-908343727691.europe-west1.run.app/docs

## 🔍 **Debug Commands**

```bash
# Check service status
gcloud run services describe medusa-backend --region=europe-west1

# View logs
gcloud run services logs read medusa-backend --region=europe-west1 --limit=50

# List environment variables
gcloud run services describe medusa-backend --region=europe-west1 --format="value(spec.template.spec.template.spec.containers[0].env[].name)"
```

## ⚠️ **Important Notes**

1. **Environment Variables**: Must be set in Google Cloud Console, not just in local `.env` files
2. **Secrets**: Use Google Secret Manager for sensitive data like API keys
3. **Build Process**: Make sure `@mercurjs` packages are built before Docker image creation
4. **Service Name**: Use `medusa-backend`, not `maretinda-backend`

## 🚀 **Next Steps After Fix**

1. ✅ Fix environment variables
2. ✅ Redeploy service  
3. ✅ Run database migrations
4. ✅ Seed database with initial data
5. ✅ Create admin user
6. ✅ Test admin panel access
7. ✅ Configure payment providers in admin panel
