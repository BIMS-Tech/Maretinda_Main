# Lalamove Shipping Integration

This document describes the comprehensive shipping management system integrated with Lalamove API for delivery tracking and management.

## Features

### 🚚 **Complete Delivery Management**
- **Quotation System**: Get real-time delivery quotes from Lalamove
- **Order Placement**: Create and manage delivery orders
- **Status Tracking**: Real-time order status updates via webhooks
- **Driver Management**: Track driver assignments and details
- **Proof of Delivery**: POD status and image tracking
- **Priority Fees**: Add tips to encourage driver acceptance

### 📊 **Admin Dashboard**
- **Shipping Dashboard**: Complete overview of all deliveries
- **Status Filtering**: Filter orders by status (Assigning, Ongoing, Completed, etc.)
- **Order Management**: Create, cancel, and track deliveries
- **Real-time Updates**: Live status updates via webhooks
- **Driver Information**: View driver details and contact info

### 🔧 **Technical Features**
- **HMAC Authentication**: Secure API communication with Lalamove
- **Webhook Integration**: Real-time status updates
- **Database Storage**: Persistent order tracking
- **Error Handling**: Robust error management and logging
- **Multi-market Support**: Support for all Lalamove markets

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Lalamove API Configuration
LALAMOVE_API_KEY=your_api_key_here
LALAMOVE_API_SECRET=your_api_secret_here
LALAMOVE_MARKET=MY
LALAMOVE_ENVIRONMENT=sandbox
LALAMOVE_WEBHOOK_URL=https://your-domain.com/store/shipping/webhook
```

### 2. API Credentials

1. **Sign up** for a Lalamove Partner account at [Lalamove Partner Portal](https://partner.lalamove.com)
2. **Get API credentials** from the Developers tab
3. **Configure webhook URL** in the Partner Portal
4. **Top up your wallet** for production usage

### 3. Market Configuration

Supported markets:
- **Malaysia (MY)**: Kuala Lumpur, Johor Bahru, Penang
- **Singapore (SG)**: Singapore
- **Thailand (TH)**: Bangkok, Chonburi
- **Hong Kong (HK)**: Hong Kong
- **Indonesia (ID)**: Jakarta, Bandung, Surabaya
- **Philippines (PH)**: Manila, Cebu
- **Vietnam (VN)**: Ho Chi Minh City, Hanoi
- **Taiwan (TW)**: Taipei, Taichung, Tainan, Kaohsiung
- **Brazil (BR)**: São Paulo, Rio de Janeiro, Belo Horizonte
- **Mexico (MX)**: Mexico City

## API Endpoints

### Admin Shipping Management

#### GET `/admin/shipping`
Get all shipping orders with optional filtering.

**Query Parameters:**
- `limit` (number): Number of orders to return (default: 50)
- `offset` (number): Number of orders to skip (default: 0)
- `status` (string): Filter by order status
- `order_id` (string): Filter by Medusa order ID

**Response:**
```json
{
  "orders": [
    {
      "id": "1",
      "order_id": "order_123",
      "lalamove_order_id": "107900701184",
      "status": "ON_GOING",
      "pickup_address": "Kuala Lumpur, Malaysia",
      "delivery_address": "Petaling Jaya, Malaysia",
      "sender_name": "John Doe",
      "recipient_name": "Jane Smith",
      "price": 25.50,
      "currency": "MYR",
      "driver_name": "David",
      "driver_phone": "+60123456789",
      "share_link": "https://share.lalamove.com/...",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 100
}
```

#### POST `/admin/shipping`
Perform shipping operations.

**Request Body:**
```json
{
  "action": "get-quotation|place-order|cancel-order|get-order|add-priority-fee|change-driver",
  "data": {
    // Action-specific data
  }
}
```

### Store Webhook

#### POST `/store/shipping/webhook`
Receive real-time updates from Lalamove.

**Webhook Events:**
- `ORDER_STATUS_CHANGED`: Order status updates
- `DRIVER_ASSIGNED`: Driver assignment notifications
- `ORDER_AMOUNT_CHANGED`: Price changes
- `ORDER_REPLACED`: Order replacement notifications
- `ORDER_EDITED`: Order modification updates

## Usage Examples

### 1. Create a Delivery Quotation

```javascript
const quotationRequest = {
  serviceType: "MOTORCYCLE",
  language: "en_MY",
  stops: [
    {
      coordinates: { lat: "3.1390", lng: "101.6869" },
      address: "Kuala Lumpur, Malaysia"
    },
    {
      coordinates: { lat: "3.0738", lng: "101.5183" },
      address: "Petaling Jaya, Malaysia"
    }
  ]
}

const response = await fetch('/admin/shipping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get-quotation',
    data: quotationRequest
  })
})
```

### 2. Place a Delivery Order

```javascript
const orderRequest = {
  quotationId: "1471722666401517645",
  sender: {
    stopId: "112345623",
    name: "John Doe",
    phone: "+60123456789"
  },
  recipients: [{
    stopId: "112345678",
    name: "Jane Smith",
    phone: "+60123456790",
    remarks: "Please call when arriving"
  }],
  isPODEnabled: true,
  metadata: {
    order_id: "medusa_order_123"
  }
}

const response = await fetch('/admin/shipping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'place-order',
    data: orderRequest
  })
})
```

### 3. Cancel an Order

```javascript
const response = await fetch('/admin/shipping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'cancel-order',
    data: {
      orderId: "107900701184",
      shippingOrderId: "1"
    }
  })
})
```

## Order Status Flow

```
ASSIGNING_DRIVER → ON_GOING → PICKED_UP → COMPLETED
       ↓              ↓           ↓
   EXPIRED        CANCELED    CANCELED
       ↓              ↓           ↓
   REJECTED       REJECTED    REJECTED
```

## Admin Dashboard Features

### 1. **Shipping Overview**
- Total orders by status
- Recent deliveries
- Performance metrics

### 2. **Order Management**
- Create new deliveries
- View order details
- Track real-time status
- Cancel orders when needed

### 3. **Driver Information**
- Driver name and contact
- Vehicle details
- Real-time location (when available)

### 4. **Delivery Tracking**
- Share links for customers
- Proof of delivery status
- Delivery timestamps

## Error Handling

The system includes comprehensive error handling for:

- **API Authentication**: Invalid credentials
- **Network Issues**: Connection timeouts
- **Rate Limiting**: API quota exceeded
- **Invalid Data**: Malformed requests
- **Webhook Failures**: Retry mechanisms

## Best Practices

### 1. **Quotation Management**
- Get fresh quotations before placing orders
- Quotations expire after 5 minutes
- Use route optimization for multiple stops

### 2. **Order Placement**
- Always include valid phone numbers
- Enable POD for important deliveries
- Add metadata for order tracking

### 3. **Status Monitoring**
- Monitor webhook delivery
- Handle failed webhooks gracefully
- Log all status changes

### 4. **Error Recovery**
- Implement retry logic for failed API calls
- Monitor API rate limits
- Handle driver rejections gracefully

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API credentials
   - Check environment variables
   - Ensure correct market setting

2. **Webhook Not Receiving Updates**
   - Verify webhook URL is accessible
   - Check server logs for errors
   - Test webhook endpoint manually

3. **Orders Not Being Created**
   - Check quotation validity (5-minute expiry)
   - Verify stop coordinates
   - Ensure sufficient wallet balance

4. **Driver Assignment Issues**
   - Check service area coverage
   - Verify pickup/delivery times
   - Consider adding priority fees

### Debug Logging

Enable debug logging by setting:
```bash
DEBUG=lalamove:*
```

## Support

For technical support:
- **Lalamove API Documentation**: [https://developers.lalamove.com](https://developers.lalamove.com)
- **Partner Support**: partner.support@lalamove.com
- **API Status**: [https://status.lalamove.com](https://status.lalamove.com)

## Changelog

### Version 1.0.0
- Initial release
- Complete Lalamove API integration
- Admin dashboard
- Webhook support
- Database storage
- Error handling




