import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetPayoutParamsType = z.infer<typeof VendorGetPayoutParams>
export const VendorGetPayoutParams = createFindParams({
  limit: 50,
  offset: 0
})

// Note: VendorCreatePayout schema removed as payout requests are now automated daily by admin
