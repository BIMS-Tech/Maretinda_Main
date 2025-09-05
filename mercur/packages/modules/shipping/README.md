# Multi-Vendor Shipping Module

A comprehensive, extensible shipping module for Medusa marketplaces that supports multiple shipping providers with unified APIs, intelligent provider selection, and real-time tracking.

## 🚀 Features

### Multi-Provider Support
- **Lalamove Integration**: Same-day delivery across Asia and Latin America
- **DHL Express**: International express shipping globally
- **Extensible Architecture**: Easy to add FedEx, UPS, local couriers, and custom providers
- **Provider Abstraction**: Unified interface regardless of shipping provider

### Intelligent Provider Selection
- **Cost Optimization**: Automatically select cheapest provider
- **Speed Priority**: Choose fastest delivery options
- **Reliability-Based**: Select most reliable providers
- **Market Coverage**: Provider availability by geographic market
- **Custom Criteria**: Flexible selection based on business rules

### Unified Order Management
- **Multi-Provider Quotations**: Compare prices across all providers
- **Seamless Order Placement**: Single API for all providers
- **Real-Time Tracking**: Unified tracking across providers
- **Status Standardization**: Consistent order status mapping
- **Webhook Integration**: Automated status updates

### Comprehensive Tracking
- **Real-Time Updates**: Live tracking information
- **Historical Data**: Complete tracking history
- **Driver Information**: Real-time driver location and details
- **Proof of Delivery**: Photo and signature capture
- **Analytics**: Performance metrics and delivery statistics

### Configuration Management
- **Environment-Based**: Sandbox and production configurations
- **Dynamic Setup**: Runtime provider configuration
- **Validation**: Configuration validation and error handling
- **Templates**: Pre-built configuration templates

## 📦 Installation

The module is already integrated into your Medusa marketplace. To use it:

1. **Configure Environment Variables**:
```bash
# Lalamove
LALAMOVE_API_KEY=pk_test_your_key
LALAMOVE_API_SECRET=sk_test_your_secret
LALAMOVE_MARKET=HK
LALAMOVE_ENVIRONMENT=sandbox

# DHL
DHL_API_KEY=your_dhl_key
DHL_API_SECRET=your_dhl_secret
DHL_ACCOUNT_NUMBER=123456789
```

2. **Import and Use**:
```typescript
import { MultiVendorShippingService } from '@mercurjs/shipping'

const shippingService = new MultiVendorShippingService(container)
```

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Vendor Shipping System             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Vendor API    │  │   Admin API     │  │  Webhooks    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              MultiVendorShippingService                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Provider Manager│  │Selection Logic  │  │ Tracking Svc │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              IShippingProvider Interface                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Lalamove Provider│  │  DHL Provider   │  │Custom Provider│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Lalamove API   │  │     DHL API     │  │  Other APIs  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Provider Interface

All shipping providers implement the `IShippingProvider` interface:

```typescript
interface IShippingProvider {
  readonly providerId: string
  readonly name: string
  readonly type: ShippingProviderType

  initialize(config: ShippingProviderConfig): Promise<void>
  isAvailable(market: string, serviceType?: string): Promise<boolean>
  getServiceTypes(market: string): Promise<string[]>
  getQuotation(request: UnifiedQuotationRequest): Promise<UnifiedQuotationResponse>
  placeOrder(request: UnifiedOrderRequest): Promise<UnifiedOrderResponse>
  getOrder(orderId: string): Promise<UnifiedOrderResponse>
  trackOrder(orderId: string): Promise<TrackingUpdate[]>
  cancelOrder(orderId: string, reason?: string): Promise<void>
  processWebhook?(payload: WebhookPayload): Promise<TrackingUpdate[]>
  getCapabilities(): ProviderCapabilities
}
```

## 🔧 Usage Examples

### 1. Get Multiple Quotations

```typescript
const quotationRequest = {
  origin: {
    coordinates: { lat: "22.3193", lng: "114.1694" },
    address: "Central, Hong Kong",
    contactName: "John Doe",
    contactPhone: "+852 1234 5678"
  },
  destinations: [{
    coordinates: { lat: "22.2587", lng: "114.1306" },
    address: "Tsim Sha Tsui, Hong Kong",
    contactName: "Jane Smith",
    contactPhone: "+852 8765 4321"
  }],
  shipment: {
    weight: "LESS_THAN_3KG",
    description: "Electronics package",
    categories: ["ELECTRONICS"]
  },
  market: "HK"
}

// Get quotations from all available providers
const quotations = await shippingService.getMultipleQuotations(quotationRequest, {
  priority: 'cost',
  maxCost: '100.00'
})

// Get the best quotation automatically
const bestQuotation = await shippingService.getBestQuotation(quotationRequest, {
  priority: 'speed',
  requiresRealTimeTracking: true
})
```

### 2. Place Order

```typescript
const orderRequest = {
  quotationId: bestQuotation.quotationId,
  sender: {
    name: "John Doe",
    phone: "+852 1234 5678",
    email: "john@example.com"
  },
  recipients: [{
    name: "Jane Smith",
    phone: "+852 8765 4321",
    instructions: "Please call before delivery"
  }],
  proofOfDelivery: true,
  metadata: {
    orderId: "ORDER-12345",
    customerNotes: "Handle with care"
  }
}

const order = await shippingService.placeOrder(orderRequest)
```

### 3. Track Order

```typescript
// Get real-time tracking
const trackingUpdates = await shippingService.trackOrder(order.orderId)

// Get comprehensive tracking information
const trackingService = new TrackingService(container)
const trackingInfo = await trackingService.getOrderTracking(order.orderId)

console.log('Current status:', trackingInfo.currentStatus)
console.log('Tracking history:', trackingInfo.trackingHistory)
```

## 🌐 API Endpoints

### Vendor API (`/api/vendor/shipping`)

#### Get Multiple Quotations
```bash
POST /api/vendor/shipping
{
  "action": "get-quotations",
  "data": { /* quotation request */ },
  "criteria": { "priority": "cost", "maxCost": "100.00" }
}
```

#### Get Best Quotation
```bash
POST /api/vendor/shipping
{
  "action": "get-best-quotation",
  "data": { /* quotation request */ },
  "criteria": { "priority": "speed" }
}
```

#### Place Order
```bash
POST /api/vendor/shipping
{
  "action": "place-order",
  "data": { /* order request */ },
  "providerId": "lalamove"
}
```

#### Track Order
```bash
POST /api/vendor/shipping
{
  "action": "track-order",
  "data": { "orderId": "ORDER-123" }
}
```

### Admin API (`/api/admin/shipping/providers`)

#### Configure Provider
```bash
POST /api/admin/shipping/providers
{
  "providerId": "lalamove",
  "name": "Lalamove",
  "type": "same_day",
  "enabled": true,
  "priority": 10,
  "configuration": {
    "apiKey": "pk_test_key",
    "apiSecret": "sk_test_secret",
    "market": "HK"
  },
  "supportedMarkets": ["HK", "SG"],
  "supportedServiceTypes": ["MOTORCYCLE", "SEDAN"]
}
```

#### Get Provider Status
```bash
GET /api/admin/shipping/providers
```

### Webhook Endpoints (`/api/store/shipping/webhooks/[provider]`)

Unified webhook handler for all providers:
- `/api/store/shipping/webhooks/lalamove`
- `/api/store/shipping/webhooks/dhl`
- `/api/store/shipping/webhooks/fedex`

## 📊 Provider Capabilities

| Feature | Lalamove | DHL | FedEx* | UPS* |
|---------|----------|-----|--------|------|
| Same Day Delivery | ✅ | ❌ | ❌ | ❌ |
| Express Delivery | ❌ | ✅ | ✅ | ✅ |
| International | ❌ | ✅ | ✅ | ✅ |
| Real-Time Tracking | ✅ | ✅ | ✅ | ✅ |
| Proof of Delivery | ✅ | ✅ | ✅ | ✅ |
| Multiple Destinations | ✅ (16) | ❌ | ❌ | ❌ |
| Priority Fees | ✅ | ❌ | ❌ | ❌ |
| Driver Change | ✅ | ❌ | ❌ | ❌ |

*Template provided for easy implementation

## 🔧 Adding New Providers

### 1. Create Provider Class

```typescript
import { BaseShippingProvider, ShippingProviderType } from '@mercurjs/shipping'

export class CustomProvider extends BaseShippingProvider {
  constructor() {
    super('custom', 'Custom Courier', ShippingProviderType.SAME_DAY)
  }

  protected async validateConfiguration(): Promise<void> {
    // Validate provider-specific configuration
  }

  protected async checkProviderAvailability(market: string): Promise<boolean> {
    // Check if provider is available in market
    return true
  }

  // Implement required methods...
}
```

### 2. Register Provider

```typescript
// Add to MultiVendorShippingService
const customProvider = new CustomProvider()
// Register in provider map
```

### 3. Configure Provider

```typescript
await shippingService.configureProvider({
  providerId: 'custom',
  name: 'Custom Courier',
  type: ShippingProviderType.SAME_DAY,
  enabled: true,
  configuration: { /* custom config */ },
  supportedMarkets: ['MY'],
  supportedServiceTypes: ['SAME_DAY', 'EXPRESS']
})
```

## 📈 Analytics & Monitoring

### Tracking Statistics

```typescript
const stats = await trackingService.getTrackingStatistics(
  new Date('2024-01-01'),
  new Date('2024-12-31')
)

console.log('Performance metrics:', {
  totalShipments: stats.totalShipments,
  onTimeDeliveryRate: stats.onTimeDeliveryRate,
  averageDeliveryTime: stats.averageDeliveryTime,
  providerPerformance: stats.providerPerformance
})
```

### Active Shipments

```typescript
const activeShipments = await trackingService.getActiveShipmentsTracking()
activeShipments.forEach(shipment => {
  console.log(`${shipment.orderId}: ${shipment.status}`)
})
```

## 🔐 Security & Best Practices

### API Keys Management
- Store API credentials in environment variables
- Use sandbox environments for testing
- Rotate keys regularly
- Implement proper access controls

### Error Handling
- Graceful fallback to alternative providers
- Comprehensive error logging
- User-friendly error messages
- Retry mechanisms for transient failures

### Performance
- Provider response caching
- Parallel quotation requests
- Database connection pooling
- Webhook signature verification

## 🛠️ Troubleshooting

### Common Issues

1. **Provider not available**
   - Check provider configuration
   - Verify API credentials
   - Confirm market support

2. **Quotation failures**
   - Validate request format
   - Check coordinate accuracy
   - Verify service type support

3. **Order placement issues**
   - Ensure quotation is still valid
   - Verify contact information
   - Check provider-specific requirements

4. **Tracking not updating**
   - Confirm webhook configuration
   - Check provider webhook status
   - Verify database connectivity

### Debug Mode

Enable debug logging:
```typescript
process.env.SHIPPING_DEBUG = 'true'
```

## 🤝 Contributing

To add new shipping providers or features:

1. Follow the `IShippingProvider` interface
2. Extend `BaseShippingProvider` for common functionality
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

## 📝 License

This module is part of the Maretinda marketplace platform.

---

## 🎯 Ready to Ship!

Your multi-vendor shipping system is now ready to handle:
- ✅ Multiple shipping providers
- ✅ Intelligent provider selection
- ✅ Real-time tracking
- ✅ Comprehensive analytics
- ✅ Webhook integration
- ✅ Scalable architecture

The system automatically chooses the best shipping provider for each order based on your criteria, provides unified tracking across all providers, and ensures reliable delivery across your marketplace! 🚀
