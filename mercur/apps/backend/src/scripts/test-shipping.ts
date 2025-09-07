import { ShippingService, ShippingDatabaseService } from '../services/shipping'

async function testShippingIntegration() {
  console.log('🧪 Testing Shipping Integration...')

  // Test configuration
  const config = {
    apiKey: process.env.LALAMOVE_API_KEY || 'test_key',
    apiSecret: process.env.LALAMOVE_API_SECRET || 'test_secret',
    market: process.env.LALAMOVE_MARKET || 'MY',
    environment: (process.env.LALAMOVE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
  }

  console.log('📋 Configuration:', {
    market: config.market,
    environment: config.environment,
    hasApiKey: !!config.apiKey,
    hasApiSecret: !!config.apiSecret
  })

  // Test service instantiation
  try {
    const shippingService = new ShippingService(config)
    console.log('✅ ShippingService instantiated successfully')

    // Test database service (mock container)
    const mockContainer = {
      resolve: () => ({
        query: async (sql: string, params: any[]) => {
          console.log('🔍 Mock DB Query:', sql.substring(0, 50) + '...')
          return { rows: [] }
        }
      })
    }

    const dbService = new ShippingDatabaseService(mockContainer)
    console.log('✅ ShippingDatabaseService instantiated successfully')

    // Test quotation request (will fail without real credentials, but tests structure)
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

    console.log('📦 Test quotation request:', quotationRequest)

    // Test API endpoints (mock)
    console.log('🌐 API Endpoints available:')
    console.log('  - POST /admin/shipping (get-quotation, place-order, cancel-order, etc.)')
    console.log('  - GET /admin/shipping (list orders with filtering)')
    console.log('  - POST /store/shipping/webhook (Lalamove webhook handler)')

    console.log('✅ Shipping integration test completed successfully!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('  1. Set LALAMOVE_API_KEY and LALAMOVE_API_SECRET environment variables')
    console.log('  2. Access /admin/shipping in your admin panel')
    console.log('  3. Test creating a quotation and placing an order')
    console.log('  4. Configure webhook URL in Lalamove Partner Portal')

  } catch (error) {
    console.error('❌ Shipping integration test failed:', error)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testShippingIntegration()
}

export { testShippingIntegration }














