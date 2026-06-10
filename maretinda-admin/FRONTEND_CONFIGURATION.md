# Admin Panel Configuration Fix

## 🐛 The Problem

Getting this error in the browser console:
```
TypeError: Failed to construct 'URL': Invalid URL
```

## 🔍 Root Cause

The admin panel is trying to connect to the backend, but `__BACKEND_URL__` is undefined or set to `"/"`, which is not a valid URL.

## ✅ The Solution

Create a `.env` file in the `admin-panel/` directory with the correct backend URL.

### Step 1: Create `.env` File

```bash
cd admin-panel

# Copy from template
cp .env.example .env

# Or create manually
cat > .env << 'EOF'
# Backend API URL
VITE_MEDUSA_BACKEND_URL=http://localhost:9000

# Storefront URL
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000

# Base path
VITE_MEDUSA_BASE=/

# B2B mode
VITE_MEDUSA_B2B_PANEL=false
EOF
```

### Step 2: Update for Your Environment

#### For Local Development
```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
```

#### For Production (Medusa Cloud)
```env
VITE_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app
```

Replace `your-project-id` with your actual Medusa Cloud project ID.

### Step 3: Restart Development Server

```bash
# Stop the dev server (Ctrl+C)

# Start it again
npm run dev
```

## 📝 Complete Configuration

### `.env` File Structure

```env
# =================================================================
# BACKEND CONNECTION
# =================================================================

# Local development
VITE_MEDUSA_BACKEND_URL=http://localhost:9000

# OR Production (uncomment and update)
# VITE_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app


# =================================================================
# STOREFRONT URL
# =================================================================

# For preview links and redirects
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000

# OR Production (uncomment and update)
# VITE_MEDUSA_STOREFRONT_URL=https://yourdomain.com


# =================================================================
# ADMIN PANEL SETTINGS
# =================================================================

# Base path (keep as "/" unless you have a custom base)
VITE_MEDUSA_BASE=/

# B2B mode (false for B2C marketplace)
VITE_MEDUSA_B2B_PANEL=false
```

## 🚀 Deployment

### For Production Build

When deploying the admin panel to production (Vercel, Netlify, etc.):

#### Vercel

Add environment variables in Vercel Dashboard:
```
VITE_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app
VITE_MEDUSA_STOREFRONT_URL=https://yourdomain.com
```

#### Netlify

Add in `netlify.toml`:
```toml
[build.environment]
  VITE_MEDUSA_BACKEND_URL = "https://your-project-id.medusa.app"
  VITE_MEDUSA_STOREFRONT_URL = "https://yourdomain.com"
```

Or add in Netlify Dashboard → Site Settings → Environment Variables

#### GitHub Actions

Add to workflow file:
```yaml
env:
  VITE_MEDUSA_BACKEND_URL: https://your-project-id.medusa.app
  VITE_MEDUSA_STOREFRONT_URL: https://yourdomain.com
```

## 🧪 Verify Configuration

### Check in Browser Console

After starting the dev server, open browser console and run:
```javascript
console.log('Backend URL:', __BACKEND_URL__)
console.log('Storefront URL:', __STOREFRONT_URL__)
```

Should show:
```
Backend URL: http://localhost:9000
Storefront URL: http://localhost:8000
```

### Test API Connection

1. Open admin panel: `http://localhost:3001` (or your configured port)
2. Try to login
3. Check Network tab - should see requests to `http://localhost:9000/admin/...`
4. No more "Invalid URL" errors!

## 🔧 Other Frontend Apps

### seller Panel

Create `/seller-panel/.env`:
```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
```

### B2C Storefront

Create `/b2c-marketplace-storefront/.env.local`:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:8000
```

Note: Next.js uses `NEXT_PUBLIC_` prefix instead of `VITE_`

## 📚 How It Works

### Vite Configuration

The `vite.config.mts` file loads environment variables:

```typescript
const BACKEND_URL = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";

export default defineConfig({
  define: {
    __BACKEND_URL__: JSON.stringify(BACKEND_URL),
  }
});
```

### In Your Code

The SDK uses the injected constant:

```typescript
// src/lib/client/client.ts
export const backendUrl = __BACKEND_URL__ ?? "/";  // ← Gets value from vite.config

export const sdk = new Medusa({
  baseUrl: backendUrl,  // ← Now has correct URL!
  auth: { type: "session" }
});
```

## 🐛 Troubleshooting

### Still Getting "Invalid URL" Error

1. **Check `.env` file exists**:
   ```bash
   ls -la admin-panel/.env
   ```

2. **Verify environment variable**:
   ```bash
   cat admin-panel/.env | grep BACKEND_URL
   ```

3. **Restart dev server** (important!):
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

4. **Clear browser cache**:
   - Open DevTools
   - Right-click refresh button → "Empty Cache and Hard Reload"

5. **Check for typos**:
   - Must be `VITE_MEDUSA_BACKEND_URL` (with `VITE_` prefix)
   - No spaces around `=`
   - URL must include `http://` or `https://`

### CORS Errors

If you see CORS errors after fixing the URL:

Update your backend's `.env` to include the admin panel URL:
```env
ADMIN_CORS=http://localhost:3001,http://localhost:7001
```

Restart backend:
```bash
cd backend
npm run dev
```

### Network Errors

If requests fail even with correct URL:

1. **Check backend is running**:
   ```bash
   curl http://localhost:9000/health
   ```

2. **Check backend CORS configuration** in `backend/medusa-config.ts`:
   ```typescript
   projectConfig: {
     http: {
       adminCors: process.env.ADMIN_CORS!,
     }
   }
   ```

3. **Verify backend environment variables** in `backend/.env`:
   ```env
   ADMIN_CORS=http://localhost:3001,http://localhost:7001
   ```

## ✅ Quick Fix Summary

```bash
# 1. Create .env file
cd admin-panel
cp .env.example .env

# 2. Edit .env with correct backend URL
echo "VITE_MEDUSA_BACKEND_URL=http://localhost:9000" >> .env

# 3. Restart dev server
npm run dev

# 4. Open browser and test
open http://localhost:3001
```

## 📋 Complete Environment Files

### admin-panel/.env
```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
VITE_MEDUSA_BASE=/
VITE_MEDUSA_B2B_PANEL=false
```

### seller-panel/.env
```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
```

### b2c-marketplace-storefront/.env.local
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:8000
```

### backend/.env
```env
DATABASE_URL=postgresql://user:pass@host:5432/medusa
STORE_CORS=http://localhost:3000,http://localhost:8000
ADMIN_CORS=http://localhost:3001,http://localhost:7001
seller_CORS=http://localhost:3002,http://localhost:5173
AUTH_CORS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173,http://localhost:8000
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
```

---

**Problem Fixed!** 🎉

Just create the `.env` file with the correct `VITE_MEDUSA_BACKEND_URL` and restart your dev server.

