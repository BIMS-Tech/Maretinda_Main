# Multi-Vendor Shipping System Usage Examples

This document provides comprehensive examples of how to use the multi-vendor shipping system with various providers like Lalamove, DHL, FedEx, and others.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Provider Management](#provider-management)
3. [Getting Quotations](#getting-quotations)
4. [Placing Orders](#placing-orders)
5. [Tracking Orders](#tracking-orders)
6. [Webhook Integration](#webhook-integration)
7. [API Examples](#api-examples)

## Setup and Configuration

### 1. Environment Variables

First, set up your environment variables for the providers you want to use:

```bash
# Lalamove Configuration
LALAMOVE_API_KEY=pk_test_your_api_key
LALAMOVE_API_SECRET=sk_test_your_api_secret
LALAMOVE_MARKET=HK
LALAMOVE_ENVIRONMENT=sandbox
LALAMOVE_WEBHOOK_URL=https://your-domain.com/api/store/shipping/webhooks/lalamove

# DHL Configuration
DHL_API_KEY=your_dhl_api_key
DHL_API_SECRET=your_dhl_api_secret
DHL_ACCOUNT_NUMBER=123456789
DHL_ENVIRONMENT=test

# FedEx Configuration (optional)
FEDEX_API_KEY=your_fedex_api_key
FEDEX_API_SECRET=your_fedex_api_secret
FEDEX_ACCOUNT_NUMBER=your_account_number
FEDEX_METER_NUMBER=your_meter_number
```

### 2. Initialize Providers

```typescript
import { 
  MultiVendorShippingService, 
  ShippingConfigManager,
  ShippingProviderType 
} from '@mercurjs/shipping'

// Initialize the shipping service
const shippingService = new MultiVendorShippingService(container)
const configManager = ShippingConfigManager.getInstance()

// Configure Lalamove provider
await shippingService.configureProvider({
  providerId: 'lalamove',
  name: 'Lalamove',
  type: ShippingProviderType.SAME_DAY,
  enabled: true,
  priority: 10,
  configuration: {
    apiKey: process.env.LALAMOVE_API_KEY,
    apiSecret: process.env.LALAMOVE_API_SECRET,
    market: 'HK',
    environment: 'sandbox'
  },
  supportedMarkets: ['HK', 'SG', 'MY', 'TH'],
  supportedServiceTypes: ['MOTORCYCLE', 'SEDAN', 'VAN'],
  webhookUrl: process.env.LALAMOVE_WEBHOOK_URL
})

// Configure DHL provider
await shippingService.configureProvider({
  providerId: 'dhl',
  name: 'DHL Express',
  type: ShippingProviderType.EXPRESS,
  enabled: true,
  priority: 8,
  configuration: {
    apiKey: process.env.DHL_API_KEY,
    apiSecret: process.env.DHL_API_SECRET,
    accountNumber: process.env.DHL_ACCOUNT_NUMBER,
    environment: 'test'
  },
  supportedMarkets: ['GLOBAL'],
  supportedServiceTypes: ['EXPRESS_WORLDWIDE', 'EXPRESS_12:00']
})
```

## Provider Management

### 1. List Available Providers

```typescript
// Get all configured providers
const providers = shippingService.getConfiguredProviders()

// Get available provider templates
const templates = configManager.getAllProviderTemplates()

console.log('Configured providers:', providers)
console.log('Available templates:', templates)
```

### 2. Enable/Disable Providers

```typescript
// Disable a provider
await shippingService.configureProvider({
  ...existingConfig,
  enabled: false
})

// Update provider priority
await shippingService.configureProvider({
  ...existingConfig,
  priority: 15
})
```

## Getting Quotations

### 1. Basic Quotation Request

```typescript
import { UnifiedQuotationRequest } from '@mercurjs/shipping'

const quotationRequest: UnifiedQuotationRequest = {
  origin: {
    coordinates: { lat: "22.3193", lng: "114.1694" },
    address: "Central, Hong Kong",
    contactName: "John Doe",
    contactPhone: "+852 1234 5678"
  },
  destinations: [
    {
      coordinates: { lat: "22.2587", lng: "114.1306" },
      address: "Tsim Sha Tsui, Hong Kong",
      contactName: "Jane Smith",
      contactPhone: "+852 8765 4321"
    }
  ],
  shipment: {
    weight: "LESS_THAN_3KG",
    description: "Electronics package",
    value: "500.00",
    currency: "HKD",
    categories: ["ELECTRONICS"]
  },
  serviceType: "MOTORCYCLE",
  market: "HK",
  language: "en_HK"
}

// Get quotations from all providers
const quotations = await shippingService.getMultipleQuotations(quotationRequest)

console.log('Available quotations:', quotations)
```

### 2. Get Best Quotation with Criteria

```typescript
import { ProviderSelectionCriteria } from '@mercurjs/shipping'

const criteria: ProviderSelectionCriteria = {
  market: "HK",
  priority: "cost", // or "speed" or "reliability"
  maxCost: "100.00",
  requiresRealTimeTracking: true,
  preferredProviders: ["lalamove"]
}

const bestQuotation = await shippingService.getBestQuotation(quotationRequest, criteria)

console.log('Best quotation:', bestQuotation)
```

### 3. Compare Multiple Providers

```typescript
const comparisons = await shippingService.getMultipleQuotations(quotationRequest, criteria)

comparisons.forEach(comparison => {
  if (comparison.available) {
    console.log(`${comparison.providerId}:`)
    console.log(`  Price: ${comparison.quotation.priceBreakdown.total} ${comparison.quotation.priceBreakdown.currency}`)
    console.log(`  Score: ${comparison.score}`)
    console.log(`  Reasoning: ${comparison.reasoning.join(', ')}`)
  } else {
    console.log(`${comparison.providerId}: Not available`)
  }
})
```

## Placing Orders

### 1. Place Order with Specific Provider

```typescript
import { UnifiedOrderRequest } from '@mercurjs/shipping'

const orderRequest: UnifiedOrderRequest = {
  quotationId: bestQuotation.quotationId,
  sender: {
    name: "John Doe",
    phone: "+852 1234 5678",
    email: "john@example.com"
  },
  recipients: [
    {
      name: "Jane Smith",
      phone: "+852 8765 4321",
      email: "jane@example.com",
      instructions: "Please call before delivery"
    }
  ],
  proofOfDelivery: true,
  metadata: {
    orderId: "ORDER-12345",
    customerNotes: "Handle with care"
  }
}

// Place order with best provider
const order = await shippingService.placeOrder(orderRequest, bestQuotation.providerId)

console.log('Order placed:', order)
```

### 2. Place Order with Auto Provider Selection

```typescript
// Let the system choose the best provider automatically
const order = await shippingService.placeOrder(orderRequest)

console.log('Order placed with provider:', order.providerId)
```

## Tracking Orders

### 1. Track Single Order

```typescript
// Track by order ID
const trackingUpdates = await shippingService.trackOrder(order.orderId)

trackingUpdates.forEach(update => {
  console.log(`${update.timestamp}: ${update.message} (${update.status})`)
})
```

### 2. Get Comprehensive Tracking Information

```typescript
import { TrackingService } from '@mercurjs/shipping'

const trackingService = new TrackingService(container)

const trackingInfo = await trackingService.getOrderTracking(order.orderId)

console.log('Current status:', trackingInfo.currentStatus)
console.log('Estimated delivery:', trackingInfo.estimatedDelivery)
console.log('Last update:', trackingInfo.lastUpdate)
console.log('Full history:', trackingInfo.trackingHistory)
```

### 3. Get Active Shipments

```typescript
const activeShipments = await trackingService.getActiveShipmentsTracking()

activeShipments.forEach(shipment => {
  console.log(`${shipment.orderId}: ${shipment.status} (${shipment.providerId})`)
})
```

## Webhook Integration

### 1. Setup Webhooks for Providers

```typescript
// Setup webhook for Lalamove
const lalamoveProvider = new LalamoveProvider()
await lalamoveProvider.setupWebhook('https://your-domain.com/api/store/shipping/webhooks/lalamove')

// The webhook endpoint will automatically handle updates from all providers
// POST /api/store/shipping/webhooks/[provider]
```

### 2. Handle Webhook Updates

```typescript
// The webhook handler automatically processes updates
// You can also manually process webhooks:

const webhookPayload = {
  type: 'ORDER_STATUS_CHANGED',
  orderId: 'order-123',
  providerId: 'lalamove',
  data: {
    orderId: 'order-123',
    status: 'PICKED_UP',
    driverInfo: {
      name: 'Driver Name',
      phone: '+852 1111 2222'
    }
  },
  timestamp: new Date().toISOString()
}

const trackingUpdates = await shippingService.processWebhook('lalamove', webhookPayload)
console.log('Processed updates:', trackingUpdates)
```

## API Examples

### 1. Get Multiple Quotations (Vendor Panel)

```bash
curl -X POST http://localhost:9000/api/vendor/shipping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "get-quotations",
    "data": {
      "origin": {
        "coordinates": {"lat": "22.3193", "lng": "114.1694"},
        "address": "Central, Hong Kong"
      },
      "destinations": [{
        "coordinates": {"lat": "22.2587", "lng": "114.1306"},
        "address": "Tsim Sha Tsui, Hong Kong"
      }],
      "shipment": {
        "weight": "LESS_THAN_3KG",
        "description": "Package"
      },
      "market": "HK"
    },
    "criteria": {
      "priority": "cost",
      "maxCost": "100.00"
    }
  }'
```

### 2. Place Order

```bash
curl -X POST http://localhost:9000/api/vendor/shipping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "place-order",
    "data": {
      "quotationId": "QUOTATION_ID_FROM_PREVIOUS_STEP",
      "sender": {
        "name": "John Doe",
        "phone": "+852 1234 5678"
      },
      "recipients": [{
        "name": "Jane Smith",
        "phone": "+852 8765 4321"
      }]
    },
    "providerId": "lalamove"
  }'
```

### 3. Track Order

```bash
curl -X POST http://localhost:9000/api/vendor/shipping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "action": "track-order",
    "data": {
      "orderId": "ORDER_ID_FROM_PLACE_ORDER"
    }
  }'
```

### 4. Configure Provider (Admin)

```bash
curl -X POST http://localhost:9000/api/admin/shipping/providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "providerId": "lalamove",
    "name": "Lalamove",
    "type": "same_day",
    "enabled": true,
    "priority": 10,
    "configuration": {
      "apiKey": "pk_test_your_key",
      "apiSecret": "sk_test_your_secret",
      "market": "HK",
      "environment": "sandbox"
    },
    "supportedMarkets": ["HK", "SG"],
    "supportedServiceTypes": ["MOTORCYCLE", "SEDAN"]
  }'
```

## Advanced Features

### 1. Provider Performance Analytics

```typescript
const stats = await trackingService.getTrackingStatistics(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'lalamove' // optional: specific provider
)

console.log('Performance statistics:', {
  totalShipments: stats.totalShipments,
  onTimeDeliveryRate: stats.onTimeDeliveryRate,
  averageDeliveryTime: stats.averageDeliveryTime,
  statusBreakdown: stats.statusBreakdown,
  providerPerformance: stats.providerPerformance
})
```

### 2. Bulk Tracking

```typescript
const orderIds = ['order-1', 'order-2', 'order-3']
const bulkTracking = await trackingService.getBulkTracking(orderIds)

Object.entries(bulkTracking).forEach(([orderId, updates]) => {
  console.log(`${orderId}: ${updates.length} updates`)
})
```

### 3. Custom Provider Implementation

```typescript
import { BaseShippingProvider, ShippingProviderType } from '@mercurjs/shipping'

class CustomCourierProvider extends BaseShippingProvider {
  constructor() {
    super('custom_courier', 'Custom Courier', ShippingProviderType.SAME_DAY)
  }

  protected async validateConfiguration(): Promise<void> {
    // Validate custom configuration
  }

  protected async checkProviderAvailability(market: string): Promise<boolean> {
    // Check if provider is available in market
    return true
  }

  async getServiceTypes(market: string): Promise<string[]> {
    return ['SAME_DAY', 'NEXT_DAY']
  }

  // Implement other required methods...
}

// Register custom provider
const customProvider = new CustomCourierProvider()
// Add to MultiVendorShippingService providers map
```

## Error Handling

```typescript
try {
  const quotations = await shippingService.getMultipleQuotations(request)
} catch (error) {
  console.error('Shipping error:', error.message)
  
  if (error.status === 402) {
    console.log('Insufficient credit with provider')
  } else if (error.status === 422) {
    console.log('Invalid request data')
  } else {
    console.log('Provider API error')
  }
}
```

This multi-vendor shipping system provides a unified interface for managing shipments across different providers, with automatic provider selection, comprehensive tracking, and flexible configuration options.
