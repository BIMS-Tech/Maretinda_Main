
import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      // @ts-expect-error: vendorCors is not a valid config
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret'
    }
  },
  admin: {
    disable: false,
  },
  loaders: [
    {
      resolve: './src/loaders'
    }
  ],
  plugins: [
    {
      resolve: '@mercurjs/b2c-core',
      options: {}
    },
    {
      resolve: '@mercurjs/commission',
      options: {}
    },
    {
      resolve: '@mercurjs/algolia',
      options: {
        apiKey: process.env.ALGOLIA_API_KEY,
        appId: process.env.ALGOLIA_APP_ID
      }
    },
    {
      resolve: '@mercurjs/reviews',
      options: {}
    },
    {
      resolve: '@mercurjs/requests',
      options: {}
    }
    // Note: @mercurjs/resend plugin disabled due to broken subscribers (uses deprecated fetchStoreData)
    // Custom subscribers in src/subscribers/ handle notifications instead
    // {
    //   resolve: '@mercurjs/resend',
    //   options: {}
    // }
  ],
  modules: [
    {
      resolve: '@mercurjs/b2c-core/modules/wishlist'
    },
    {
      resolve: '@medusajs/medusa/cache-inmemory'
    },
    {
      resolve: '@medusajs/medusa/event-bus-local'
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-inmemory'
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/payment-giyapay',
            id: 'giyapay',
            options: {
              // GiyaPay configuration options will be loaded from service
            }
          }
        ]
      }
    },
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: '@mercurjs/resend/providers/resend',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL
            }
          },
          {
            resolve: '@medusajs/medusa/notification-local',
            id: 'local',
            options: {
              channels: ['feed', 'seller_feed']
            }
          }
        ]
      }
    }
  ]
})
