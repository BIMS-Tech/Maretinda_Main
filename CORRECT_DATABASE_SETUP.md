# ✅ CORRECT DATABASE CONNECTION SETUP

## Your Database Details:
- **Instance**: `maretinda-test:europe-west1:maretinda-test`
- **Public IP**: `35.187.58.154`
- **Database**: `maretindadb`
- **Username**: `maretinda-db-test-user-1`
- **Password**: `Maretinda169831#`

## 🔧 **CORRECT Environment Variables for Cloud Run**

Go to: https://console.cloud.google.com/run/detail/europe-west1/medusa-backend/variables

**UPDATE THESE ENVIRONMENT VARIABLES:**

### **Database Connection (CRITICAL)**
```
DATABASE_URL=postgres://maretinda-db-test-user-1:Maretinda169831%23@35.187.58.154:5432/maretindadb
```
*Note: `#` is URL-encoded as `%23`*

### **Service URLs (Fix localhost)**
```
NODE_ENV=production
PORT=8080
BACKEND_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app
FRONTEND_URL=https://your-storefront-domain.com
STOREFRONT_URL=https://your-storefront-domain.com
VENDOR_PANEL_URL=https://your-vendor-panel-domain.com
```

### **GiyaPay Callbacks**
```
GIYAPAY_SUCCESS_CALLBACK_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app/api/payment/giyapay/complete
GIYAPAY_ERROR_CALLBACK_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app/api/payment/giyapay/error
GIYAPAY_CANCEL_CALLBACK_URL=https://medusa-backend-yi6mw2mlka-ew.a.run.app/api/payment/giyapay/cancel
```

### **CORS Settings**
```
STORE_CORS=*
ADMIN_CORS=*
VENDOR_CORS=*
AUTH_CORS=*
```

### **Keep These As-Is**
```
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
STRIPE_SECRET_API_KEY=sk_test_51Rh3pGDH86YX7JHK1yJI7DA8adY4hQTutoeVPKf89EUZNbG7sFaBwTrB4mGqCglKruK3vWzlJOFraceT6uxkDBFe00DX6JCXaE
STRIPE_CONNECTED_ACCOUNTS_WEBHOOK_SECRET=supersecret
RESEND_API_KEY=re_UjX8k385_FTmyj596Wu3PhThfA2ExexbT
RESEND_FROM_EMAIL=onboarding@resend.dev
ALGOLIA_APP_ID=NHTRZ50SO0
ALGOLIA_API_KEY=18ae4972b7fe95dd2e9074178f2985e6
VITE_TALK_JS_APP_ID=t026lydl
VITE_TALK_JS_SECRET_API_KEY=sk_test_xMi96iHQGcb90AwckVsIekH2MK1yG6fD
```

### **REMOVE THESE (not needed)**
```
❌ REDIS_URL=redis://localhost:6379
❌ DB_NAME=finalmaretinda
```

## 🚀 **Step-by-Step Process**

### **Step 1: Update Environment Variables**
1. Go to Cloud Console
2. Update the environment variables above
3. Click "Deploy" to apply changes

### **Step 2: Wait for Deployment**
Your service will redeploy automatically after env var changes.

### **Step 3: Test Connection**
```bash
curl https://medusa-backend-yi6mw2mlka-ew.a.run.app/health
```

### **Step 4: Run Database Migration**
```bash
./fix-cloud-run.sh migrate
```

### **Step 5: Run Seed Script**
```bash
./fix-cloud-run.sh seed
```

### **Step 6: Create Admin User**
```bash
./fix-cloud-run.sh admin
```

## 🎯 **Your Service URLs After Fix**

- **Backend API**: https://medusa-backend-yi6mw2mlka-ew.a.run.app
- **Admin Panel**: https://medusa-backend-yi6mw2mlka-ew.a.run.app/app
- **Vendor Panel**: https://medusa-backend-yi6mw2mlka-ew.a.run.app/vendor
- **API Docs**: https://medusa-backend-yi6mw2mlka-ew.a.run.app/docs

## ⚠️ **Important Notes**

1. **Password Encoding**: The `#` in your password is encoded as `%23` in the URL
2. **Public IP**: Using the public IP `35.187.58.154` since you have public connectivity enabled
3. **Port**: Database uses standard PostgreSQL port `5432`
4. **SSL**: Not required since "Allow only SSL connections" is disabled

After updating these environment variables, your next GitHub push (or manual redeploy) should work properly!
