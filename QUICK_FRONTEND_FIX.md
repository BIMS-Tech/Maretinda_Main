# 🚀 Quick Fix: "Invalid URL" Error

## The Error You're Seeing

```
TypeError: Failed to construct 'URL': Invalid URL
```

## The Fix (Takes 30 seconds)

### For Admin Panel

```bash
cd admin-panel

# Create .env file
cat > .env << 'EOF'
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
VITE_MEDUSA_BASE=/
VITE_MEDUSA_B2B_PANEL=false
EOF

# Restart dev server
npm run dev
```

### For Vendor Panel

```bash
cd vendor-panel

# Create .env file
cat > .env << 'EOF'
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
EOF

# Restart dev server
npm run dev
```

### For B2C Storefront

```bash
cd b2c-marketplace-storefront

# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:8000
EOF

# Restart dev server
npm run dev
```

## For Production

Update the backend URL to your Medusa Cloud URL:

```env
# Admin Panel & Vendor Panel
VITE_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app

# B2C Storefront
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app
```

## That's It!

Refresh your browser and the error should be gone.

---

**Full Documentation**: See [`admin-panel/FRONTEND_CONFIGURATION.md`](./admin-panel/FRONTEND_CONFIGURATION.md) for complete details.

