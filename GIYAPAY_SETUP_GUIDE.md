# GiyaPay Configuration Guide

## Overview
This guide will help you configure GiyaPay payment provider for your marketplace. There are multiple ways to configure it depending on which backend you're using.

## Prerequisites
- GiyaPay Merchant ID
- GiyaPay Merchant Secret
- Backend server running

## Method 1: Using Backend Admin Interface (Recommended)

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

### Step 2: Create Admin User (if needed)
```bash
cd backend
npm run create:admin
```

### Step 3: Access Admin Interface
1. Open browser to `http://localhost:9000/admin`
2. Login with your admin credentials
3. Navigate to **GiyaPay** in the sidebar
4. Fill in your merchant credentials:
   - **Merchant ID**: Your GiyaPay merchant ID
   - **Merchant Secret**: Your GiyaPay merchant secret
   - **Sandbox Mode**: Toggle based on environment (ON for testing, OFF for production)
   - **Enable GiyaPay**: Keep this ON
5. Click **Save Configuration**

### Step 4: Configure Payment Methods
1. In the same GiyaPay admin page, scroll to **Payment Methods**
2. Select which payment methods to enable:
   - InstaPay
   - Visa
   - Mastercard
   - GCash
   - PayMaya
3. Click **Save Payment Methods**

## Method 2: Environment Variables (Alternative)

If you can't access the admin interface, add these to your backend `.env` file:

```env
# GiyaPay Configuration
GIYAPAY_MERCHANT_ID=your_merchant_id_here
GIYAPAY_MERCHANT_SECRET=your_merchant_secret_here
GIYAPAY_SANDBOX_MODE=true  # Set to false for production
```

## Method 3: Direct API Configuration

You can also configure via API calls:

### Configure Credentials
```bash
curl -X POST http://localhost:9000/admin/giyapay \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "your_merchant_id",
    "merchantSecret": "your_merchant_secret", 
    "sandboxMode": true,
    "isEnabled": true
  }'
```

### Configure Payment Methods
```bash
curl -X POST http://localhost:9000/admin/giyapay/payment-methods \
  -H "Content-Type: application/json" \
  -d '{
    "enabledMethods": ["instapay", "visa", "mastercard", "gcash", "paymaya"]
  }'
```

## Verification Steps

### Step 1: Check Configuration
```bash
curl http://localhost:9000/admin/giyapay
```
Should return your configuration (with masked secret).

### Step 2: Check Payment Providers
```bash
curl "http://localhost:9000/store/payment-providers?region_id=YOUR_REGION_ID"
```
Should include GiyaPay payment methods like:
- `pp_giyapay_instapay`
- `pp_giyapay_visa`
- `pp_giyapay_mastercard`
- `pp_giyapay_gcash`
- `pp_giyapay_paymaya`

### Step 3: Test Checkout
1. Add items to cart in your storefront
2. Go to checkout
3. Verify GiyaPay payment options appear in the payment section

## Troubleshooting

### GiyaPay Options Don't Appear in Checkout
1. **Check Configuration**: Ensure `isEnabled: true` in admin
2. **Check Region**: Make sure you're using the correct region ID
3. **Check Backend URL**: Verify storefront is pointing to correct backend
4. **Restart Services**: Restart both backend and storefront after configuration

### Admin Interface Not Accessible
1. **Check Port**: Admin usually runs on port 9000
2. **Create Admin User**: Run `npm run create:admin` in backend directory
3. **Check CORS**: Ensure admin CORS is properly configured

### API Returns Unauthorized
1. **Authentication Required**: Admin endpoints require authentication
2. **Use Admin Interface**: Recommended approach for configuration
3. **Environment Variables**: Use as fallback method

## File Locations

- **Admin Interface**: `backend/src/admin/routes/giyapay/page.tsx`
- **API Endpoints**: 
  - `backend/src/api/admin/giyapay/route.ts`
  - `backend/src/api/admin/giyapay/payment-methods/route.ts`
- **Service**: `backend/src/services/giyapay.ts`
- **Payment Provider**: Configured in `backend/medusa-config.ts`

## Next Steps

After configuration:
1. Test payments in sandbox mode
2. Verify transaction logging in admin interface
3. Switch to production mode when ready
4. Monitor transactions in the GiyaPay admin section

## Support

If you encounter issues:
1. Check backend logs for errors
2. Verify GiyaPay credentials are correct
3. Ensure all services are running
4. Check database connectivity
