
import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// In production we run two Cloud Run services from this same image:
//   - server  (MEDUSA_WORKER_MODE=server) handles HTTP/API traffic
//   - worker  (MEDUSA_WORKER_MODE=worker) handles subscribers, scheduled
//     jobs and the event bus. Both share Redis so cache/events/workflows are
//     consistent across all autoscaled instances.
const REDIS_URL = process.env.REDIS_URL
const workerMode = (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server') || 'shared'

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    workerMode,
    ...(REDIS_URL ? { redisUrl: REDIS_URL } : {}),
    ...(process.env.DB_HOST ? {
      databaseDriverOptions: { host: process.env.DB_HOST }
    } : {}),
    // Modules default to SSL for any database host other than localhost (the
    // URL's ssl_mode is stripped before they see it), so the DigitalOcean
    // compose stack's private Postgres needs SSL turned off explicitly.
    ...(process.env.DATABASE_SSL === 'false' ? {
      databaseDriverOptions: { connection: { ssl: false } }
    } : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      // @ts-expect-error: vendorCors is not a valid config — mercurjs reads this key
      vendorCors: (process.env.SELLER_CORS || process.env.VENDOR_CORS)!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret'
    }
  },
  admin: {
    disable: process.env.NODE_ENV === 'production',
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
    ...(process.env.ALGOLIA_API_KEY && process.env.ALGOLIA_APP_ID ? [{
      resolve: '@mercurjs/algolia',
      options: {
        apiKey: process.env.ALGOLIA_API_KEY.trim(),
        appId: process.env.ALGOLIA_APP_ID.trim()
      }
    }] : []),
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
      resolve: '@medusajs/medusa/auth',
      options: {
        providers: [
          {
            resolve: '@medusajs/auth-emailpass',
            id: 'emailpass',
            options: {}
          },
          {
            resolve: '@medusajs/auth-google',
            id: 'google',
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL
            }
          }
        ]
      }
    },
    {
      resolve: '@mercurjs/b2c-core/modules/wishlist'
    },
    // Cloudflare R2 through Medusa's S3 provider when S3_* is set (production
    // on DigitalOcean), otherwise the GCS provider. Only one file provider can
    // be active. utils/google-cloud-storage.ts makes the same choice for the
    // custom upload routes.
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          process.env.S3_ENDPOINT && process.env.S3_BUCKET
            ? {
                resolve: '@medusajs/medusa/file-s3',
                id: 's3',
                options: {
                  file_url: process.env.S3_FILE_URL,
                  access_key_id: process.env.S3_ACCESS_KEY_ID,
                  secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                  region: process.env.S3_REGION || 'auto',
                  bucket: process.env.S3_BUCKET,
                  endpoint: process.env.S3_ENDPOINT,
                  // Same key layout as the GCS provider, so migrated objects keep their paths
                  prefix: 'medusa/public/'
                }
              }
            : {
                resolve: './src/modules/file-gcs',
                id: 'gcs',
                options: {}
              }
        ]
      }
    },
    // Redis-backed cache / event bus / workflow engine in production (when
    // REDIS_URL is set) so state is shared across all instances and the
    // server/worker split works. Falls back to in-memory for local dev.
    ...(REDIS_URL
      ? [
          {
            resolve: '@medusajs/medusa/cache-redis',
            options: { redisUrl: REDIS_URL }
          },
          {
            resolve: '@medusajs/medusa/event-bus-redis',
            options: { redisUrl: REDIS_URL }
          },
          {
            resolve: '@medusajs/medusa/workflow-engine-redis',
            options: { redis: { url: REDIS_URL } }
          }
        ]
      : [
          { resolve: '@medusajs/medusa/cache-inmemory' },
          { resolve: '@medusajs/medusa/event-bus-local' },
          { resolve: '@medusajs/medusa/workflow-engine-inmemory' }
        ]),
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
          // Standard manual (flat-rate) provider. Required: the seller panel
          // creates shipping options with provider_id "manual_manual", and
          // adding such a method to a cart resolves "fp_manual_manual" from the
          // container. Without this registration the container can't resolve it
          // and checkout 500s ("Could not resolve 'fp_manual_manual'").
          {
            resolve: '@medusajs/medusa/fulfillment-manual',
            id: 'manual',
            options: {},
          },
          {
            resolve: './src/modules/maretinda-shipping',
            id: 'maretinda',
            options: {},
          },
        ],
      },
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
            resolve: './src/modules/notification-resend',
            id: 'maretinda-resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL || 'orders@maretinda.com'
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
