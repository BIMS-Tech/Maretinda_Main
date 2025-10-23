import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { SellerDTO } from '@mercurjs/framework'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

export const fetchSellerByAuthActorId = async (
  authActorId: string,
  scope: MedusaContainer,
  fields: string[] = ['id']
): Promise<SellerDTO> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  // WORKAROUND FOR MEDUSA SQL BUG:
  // Instead of filtering sellers by members (which causes s2.seller_id error),
  // we first fetch the member to get seller_id, then fetch the seller directly
  
  // Step 1: Get the member to find their seller_id
  const {
    data: [member]
  } = await query.graph({
    entity: 'member',
    filters: {
      id: authActorId
    },
    fields: ['id', 'seller_id']
  })

  if (!member || !member.seller_id) {
    throw new Error('Member not found or not associated with a seller')
  }

  // Step 2: Fetch the seller by ID directly (avoids the problematic join)
  const {
    data: [seller]
  } = await query.graph({
    entity: 'seller',
    filters: {
      id: member.seller_id
    },
    fields
  })
  
  return seller
}
