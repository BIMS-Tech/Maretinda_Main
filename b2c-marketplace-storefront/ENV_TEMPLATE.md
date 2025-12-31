# B2C Storefront Environment Variables Template

Copy this content to create your `.env.local` file:

```bash
# Quick setup
cd b2c-marketplace-storefront
cat > .env.local << 'EOF'
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:8000
EOF
```

Or create `.env.local` file manually with this content:

```env
# Backend API URL - REQUIRED
# Note: Next.js uses NEXT_PUBLIC_ prefix
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Storefront URL
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:8000
```

## Production Configuration

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-project-id.medusa.app
NEXT_PUBLIC_STOREFRONT_URL=https://yourdomain.com
```

## After Creating .env.local

1. Restart your dev server (Ctrl+C then `npm run dev`)
2. Refresh your browser
3. The connection should work!

## Note

- Next.js uses `.env.local` (not `.env`)
- Environment variables must have `NEXT_PUBLIC_` prefix to be accessible in the browser

