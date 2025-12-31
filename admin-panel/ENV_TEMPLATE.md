# Admin Panel Environment Variables Template

Copy this content to create your `.env` file:

```bash
# Quick setup
cd admin-panel
cat > .env << 'EOF'
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
VITE_MEDUSA_BASE=/
VITE_MEDUSA_B2B_PANEL=false
EOF
```

Or create `.env` file manually with this content:

```env
# Backend API URL - REQUIRED
# Change this to your Medusa Cloud URL for production
VITE_MEDUSA_BACKEND_URL=http://localhost:9000

# Storefront URL - For preview links
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000

# Base path - Usually "/"
VITE_MEDUSA_BASE=/

# B2B mode - false for B2C marketplace
VITE_MEDUSA_B2B_PANEL=false
```

## Production Configuration

For production deployment, use your Medusa Cloud URL:

```env
VITE_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app
VITE_MEDUSA_STOREFRONT_URL=https://yourdomain.com
VITE_MEDUSA_BASE=/
VITE_MEDUSA_B2B_PANEL=false
```

## After Creating .env

1. Restart your dev server (Ctrl+C then `npm run dev`)
2. Refresh your browser
3. The "Invalid URL" error should be gone!

