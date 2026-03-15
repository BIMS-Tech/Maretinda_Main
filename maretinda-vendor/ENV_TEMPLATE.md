# Vendor Panel Environment Variables Template

Copy this content to create your `.env` file:

```bash
# Quick setup
cd vendor-panel
cat > .env << 'EOF'
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
EOF
```

Or create `.env` file manually with this content:

```env
# Backend API URL - REQUIRED
VITE_MEDUSA_BACKEND_URL=http://localhost:9000

# Storefront URL - For preview links
VITE_MEDUSA_STOREFRONT_URL=http://localhost:8000
```

## Production Configuration

```env
VITE_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app
VITE_MEDUSA_STOREFRONT_URL=https://yourdomain.com
```

## After Creating .env

1. Restart your dev server (Ctrl+C then `npm run dev`)
2. Refresh your browser
3. The connection should work!

