import { z } from 'zod'
import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export const StoreGetWishlistsParams = createFindParams({
  offset: 0,
  limit: 50
})

export const StoreCreateWishlist = z.object({
  reference: z.enum(['product']),
  reference_id: z.string()
})




