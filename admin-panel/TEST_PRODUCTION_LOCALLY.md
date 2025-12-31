# Test Production Build Locally

Want to see exactly what will run on Cloud Run? Test it locally!

## 🧪 Quick Test

```bash
cd admin-panel

# 1. Create production build
yarn build:preview

# 2. Serve it (same as Cloud Run)
yarn start

# 3. Open http://localhost:3000
```

This is **exactly** what runs on Cloud Run! ✅

## 📊 What You'll See

### Development Mode (5173)
```bash
yarn dev
```
```
VITE v5.4.20 ready in 1805 ms
➜ Local: http://localhost:5173/
```
- Fast hot reload
- Source maps
- Dev tools
- ✅ Perfect for coding!

### Production Mode (3000)
```bash
yarn build:preview
yarn start
```
```
Built in 45s
Serving on http://localhost:3000
```
- Optimized bundle
- Fast loading
- Production-ready
- ✅ What Cloud Run runs!

## 🔍 Compare the Output

### Dev Build (NOT production)
```bash
yarn dev
# Output:
# node_modules/
# src/ (uncompiled TypeScript)
# No optimization
```

### Production Build (Cloud Run)
```bash
yarn build:preview
ls -lh dist/
# Output:
# dist/
#   ├── index.html (minified)
#   ├── assets/
#   │   ├── index-abc123.js (minified, 500KB)
#   │   └── index-abc123.css (minified, 50KB)
# Optimized & ready! ✅
```

## 💡 Test with Docker (Exact Cloud Run Environment)

```bash
cd admin-panel

# Build Docker image (same as Cloud Run)
docker build \
  --build-arg VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app \
  -t admin-panel-test .

# Run it (same as Cloud Run)
docker run -p 3000:3000 admin-panel-test

# Open http://localhost:3000
# This is EXACTLY what runs on Cloud Run! ✅
```

## ✅ Checklist

Before deploying, verify locally:

- [ ] `yarn build:preview` completes without errors
- [ ] `dist/` folder created with files
- [ ] `yarn start` serves on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can login with backend credentials
- [ ] No console errors
- [ ] Backend API calls work

## 🐛 If Production Build Fails Locally

### Error: "Failed to fetch"
**Issue**: Backend URL not set correctly

**Fix**: Create `.env` file:
```bash
echo "VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app" > .env
yarn build:preview
```

### Error: "Module not found"
**Issue**: Missing dependencies

**Fix**:
```bash
rm -rf node_modules
yarn install
yarn build:preview
```

### Error: "Out of memory"
**Issue**: Build requires more memory

**Fix**:
```bash
NODE_OPTIONS=--max-old-space-size=4096 yarn build:preview
```

## 🎯 The Point

**If it works with `yarn build:preview` + `yarn start` locally, it will work on Cloud Run!** ✅

This is why we use port 3000 in production - it's serving the optimized build, not running a dev server.

---

**Quick Test**: `yarn build:preview && yarn start` → Open http://localhost:3000 → Should work! 🚀

