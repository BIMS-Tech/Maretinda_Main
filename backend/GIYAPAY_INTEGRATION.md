# GiyaPay Integration for Maretinda Backend

This document describes the GiyaPay payment integration implemented in the Maretinda backend system.

## Overview

GiyaPay is a payment gateway that supports various payment methods including GCash, PayMaya, and other Philippine payment systems. This integration provides:

- Payment processing through GiyaPay API
- Admin panel configuration interface
- Transaction tracking and management
- Webhook handling for payment status updates

## Architecture

### Backend Components

1. **Payment Provider Module** (`src/modules/payment-giyapay/`)
   - `src/services/giyapay-provider.ts` - Main payment provider service
   - `src/index.ts` - Module definition and exports
   - `package.json` - Module dependencies
   - `tsconfig.json` - TypeScript configuration

2. **Database Models** (`src/models/`)
   - `giyapay-config.ts` - Configuration storage model
   - `giyapay-transaction.ts` - Transaction tracking model

3. **Services** (`src/services/`)
   - `giyapay.ts` - Business logic service for configuration and transaction management

4. **API Routes** (`src/api/`)
   - `admin/giyapay/route.ts` - Admin configuration endpoints
   - `admin/giyapay/transactions/route.ts` - Transaction management endpoints
   - `store/giyapay/success/route.ts` - Payment success callback
   - `store/giyapay/error/route.ts` - Payment error callback
   - `store/giyapay/cancel/route.ts` - Payment cancellation callback
   - `store/giyapay/update/route.ts` - Webhook for payment updates

5. **Loaders** (`src/loaders/`)
   - `giyapay.ts` - Service registration loader
   - `index.ts` - Main loader coordinator

### Admin Panel Components

1. **Configuration Page** (`admin-panel/src/routes/giyapay/page.tsx`)
   - GiyaPay settings management
   - Transaction history viewing
   - Real-time configuration updates

2. **API Hooks** (`admin-panel/src/hooks/api/giyapay.tsx`)
   - React Query hooks for API communication
   - Configuration management
   - Transaction data fetching

## Configuration

### Environment Variables

```bash
# GiyaPay Configuration (optional - can be configured via admin panel)
GIYAPAY_MERCHANT_ID=your_merchant_id
GIYAPAY_MERCHANT_SECRET=your_merchant_secret
GIYAPAY_SANDBOX_MODE=true  # Set to false for production

# Required for callback URLs
BACKEND_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
```

### Medusa Configuration

The GiyaPay payment provider is registered in `medusa-config.ts`:

```typescript
{
  resolve: '@medusajs/medusa/payment',
  options: {
    providers: [
      {
        resolve: './src/modules/payment-giyapay',
        id: 'giyapay',
        options: {
          // Configuration loaded from service
        }
      }
    ]
  }
}
```

## Usage

### Admin Panel Configuration

1. Navigate to the GiyaPay section in the admin panel
2. Click "Edit" to modify settings
3. Enter your GiyaPay Merchant ID and Secret
4. Configure sandbox mode (enabled for testing, disabled for production)
5. Enable/disable the payment provider
6. Save the configuration

### Payment Flow

1. Customer selects GiyaPay at checkout
2. Payment session is initiated with GiyaPay API
3. Customer is redirected to GiyaPay payment page
4. After payment, customer is redirected back based on result:
   - Success: `/giyapay/success` → Order confirmation
   - Error: `/giyapay/error` → Error page
   - Cancel: `/giyapay/cancel` → Checkout page

### Webhook Handling

GiyaPay sends payment updates to `/store/giyapay/update` endpoint, which:
- Validates the webhook payload
- Updates transaction records
- Triggers any necessary business logic

## Database Schema

### giyapay_config

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| merchant_id | VARCHAR(255) | GiyaPay merchant ID |
| merchant_secret | VARCHAR(255) | GiyaPay merchant secret |
| sandbox_mode | BOOLEAN | Sandbox/live mode flag |
| is_enabled | BOOLEAN | Provider enabled flag |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

### giyapay_transaction

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| reference_number | VARCHAR(255) | GiyaPay reference number |
| order_id | VARCHAR(255) | Associated order ID |
| amount | DECIMAL(10,2) | Transaction amount |
| currency | VARCHAR(10) | Currency code (default: PHP) |
| status | VARCHAR(50) | Transaction status |
| gateway | VARCHAR(50) | Payment method used |
| description | TEXT | Transaction description |
| payment_data | JSONB | Full payment response data |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

## API Endpoints

### Admin Endpoints

- `GET /admin/giyapay` - Get current configuration
- `POST /admin/giyapay` - Update configuration
- `GET /admin/giyapay/transactions` - Get transaction history

### Store Endpoints

- `GET /store/giyapay/success` - Payment success callback
- `GET /store/giyapay/error` - Payment error callback  
- `GET /store/giyapay/cancel` - Payment cancellation callback
- `POST /store/giyapay/update` - Payment status webhook

## Security

- Merchant secrets are stored securely in the database
- API responses hide sensitive information
- Webhook signatures are validated using HMAC-SHA256
- All database operations use parameterized queries

## Error Handling

- Comprehensive error logging for debugging
- Graceful fallbacks when services are unavailable
- User-friendly error messages in the admin panel
- Proper HTTP status codes for all responses

## Testing

The integration supports both sandbox and live modes:
- Sandbox mode: Uses GiyaPay's test environment
- Live mode: Uses GiyaPay's production environment

Configure the mode through the admin panel or environment variables.

## Troubleshooting

### Common Issues

1. **Service not registered**: Ensure loaders are properly configured
2. **Database connection issues**: Check database configuration
3. **Webhook failures**: Verify callback URLs are accessible
4. **Configuration not saving**: Check admin panel API connectivity

### Debug Logging

Enable debug logging by checking the console output for:
- `[GiyaPay Loader]` - Service registration
- `[GiyaPay Provider]` - Payment processing
- `[GiyaPayService]` - Database operations
- `[GiyaPay Success/Error/Cancel]` - Callback handling

## Integration Checklist

- [x] Payment provider module created
- [x] Database models defined
- [x] Services implemented
- [x] API routes configured
- [x] Admin panel integration
- [x] Webhook handling
- [x] Error handling
- [x] Security measures
- [x] Documentation

The GiyaPay integration is now fully implemented and ready for use!









