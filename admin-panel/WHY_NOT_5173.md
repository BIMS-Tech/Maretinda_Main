# Why Port 3000 (Not 5173) for Cloud Run?

## 🤔 The Question

"Port 5173 works great locally with `yarn dev`. Why change it for Cloud Run?"

## ✅ The Answer

You're running **two different things**:

### Local Development (Port 5173)
```bash
yarn dev
```
- Starts **Vite Dev Server**
- Hot Module Replacement (HMR)
- Source maps for debugging
- Live code reloading
- Development optimizations
- **Perfect for local development! ✅**

### Cloud Run Production (Port 3000)
```bash
yarn build:preview  # Creates dist/
yarn start          # Serves dist/ on port 3000
```
- Serves **pre-built static files**
- Minified and optimized code
- No HMR overhead
- Fast startup
- Production-ready
- **Required for Cloud Run! ✅**

## 📊 Comparison

| Feature | Dev Server (5173) | Production (3000) |
|---------|-------------------|-------------------|
| **Command** | `yarn dev` | `yarn build` + `yarn start` |
| **Speed** | Slower (on-demand compilation) | Faster (pre-built) |
| **Memory** | Higher (watchers, HMR) | Lower (static serving) |
| **Security** | Source maps exposed ⚠️ | Minified code ✅ |
| **Startup** | 2-5 seconds | < 1 second |
| **For Production** | ❌ No | ✅ Yes |

## ⚠️ Why Dev Server Fails on Cloud Run

1. **Timeout Issues**: Dev server takes longer to start → `DEADLINE_EXCEEDED` error
2. **Resource Waste**: HMR watchers consume memory unnecessarily
3. **Security Risk**: Source code and maps are exposed
4. **Not Designed for It**: Vite dev server is explicitly for development
5. **Cost**: Uses more CPU/memory = higher Cloud Run bills

## 🎯 The Right Way

### Local Development
```bash
cd admin-panel
yarn dev
# Opens on http://localhost:5173 ✅
# Perfect for development!
```

### Cloud Run Production
```bash
# Dockerfile does this:
yarn build:preview  # → Creates optimized dist/ folder
serve -s dist -l 3000  # → Serves static files on port 3000 ✅
# Fast, secure, production-ready!
```

## 📝 What the Dockerfile Does

```dockerfile
# 1. Install dependencies
yarn install

# 2. Build production files WITH your backend URL
ENV VITE_MEDUSA_BACKEND_URL=https://maretindatest.medusajs.app
yarn build:preview
# → Creates: dist/index.html, dist/assets/*.js, dist/assets/*.css

# 3. Serve the built files on port 3000
serve -s dist -l 3000
# → Fast, secure, production-ready! ✅
```

## 🔍 How to Verify Locally

Want to test what Cloud Run will run? Try this locally:

```bash
cd admin-panel

# 1. Build production files
yarn build:preview

# 2. Serve them (like Cloud Run does)
yarn start
# Opens on http://localhost:3000

# This is what runs on Cloud Run! ✅
```

## 💡 Key Takeaway

- **Port 5173 = Development** (`yarn dev`)
  - ✅ Use locally for development
  - ❌ Don't use on Cloud Run

- **Port 3000 = Production** (`yarn start`)
  - ❌ Not needed locally (use 5173)
  - ✅ Required for Cloud Run

## 🚀 Workflow

```
┌─────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT                               │
│ yarn dev → Port 5173                            │
│ • Fast development                              │
│ • Hot reload                                    │
│ • Debug tools                                   │
└─────────────────────────────────────────────────┘
                    ↓
              git push main
                    ↓
┌─────────────────────────────────────────────────┐
│ CLOUD BUILD                                     │
│ yarn build:preview → Creates dist/              │
│ • Optimized & minified                          │
│ • Environment variables baked in                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ CLOUD RUN                                       │
│ serve -s dist -l 3000 → Port 3000               │
│ • Fast startup                                  │
│ • Low resource usage                            │
│ • Production-ready                              │
└─────────────────────────────────────────────────┘
```

## 🎓 Summary

**Port 5173 works locally** because that's what Vite's dev server uses. It's perfect for development!

**Port 3000 is needed for Cloud Run** because we're serving pre-built static files, not running a dev server. It's faster, more secure, and production-ready.

**You use both**:
- 5173 during development ✅
- 3000 in production ✅

This is the standard practice for Vite apps! 🎉

---

**TL;DR**: Dev server (5173) = development. Static server (3000) = production. Different tools for different jobs! 🛠️

