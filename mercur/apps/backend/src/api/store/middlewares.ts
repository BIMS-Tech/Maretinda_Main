import { MiddlewareRoute, authenticate } from '@medusajs/framework'

import { storeCartsMiddlewares } from './carts/middlewares'
import { storeOrderSetMiddlewares } from './order-set/middlewares'
import { storeOrderReturnRequestsMiddlewares } from './return-request/middlewares'
import { storeReturnsMiddlewares } from './returns/middlewares'
import { storeReviewMiddlewares } from './reviews/middlewares'
import { storeSellerMiddlewares } from './seller/middlewares'
import { storeShippingOptionRoutesMiddlewares } from './shipping-options/middlewares'
import { storeWishlistMiddlewares } from './wishlist/middlewares'

// GiyaPay callback routes that don't require authentication
const giyaPayMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/giyapay/*',
    middlewares: [] // No authentication required for GiyaPay callbacks
  }
]

export const storeMiddlewares: MiddlewareRoute[] = [
  ...giyaPayMiddlewares, // Add GiyaPay middlewares first (no auth)
  {
    matcher: '/store/reviews/*',
    middlewares: [authenticate('customer', ['bearer', 'session'])]
  },
  {
    matcher: '/store/return-request/*',
    middlewares: [authenticate('customer', ['bearer', 'session'])]
  },
  ...storeCartsMiddlewares,
  ...storeOrderReturnRequestsMiddlewares,
  ...storeOrderSetMiddlewares,
  ...storeReviewMiddlewares,
  ...storeSellerMiddlewares,
  ...storeShippingOptionRoutesMiddlewares,
  ...storeWishlistMiddlewares,
  ...storeReturnsMiddlewares
]
