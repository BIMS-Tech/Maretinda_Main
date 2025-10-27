import { toHandle, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SellerDTO, SellerEvents, UpdateSellerDTO } from '@mercurjs/framework'
import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

export const updateSellerStep = createStep(
  'update-seller',
  async (input: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)
    const eventBus = container.resolve(Modules.EVENT_BUS)
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Use retrieveSeller instead of listSellers to avoid SQL bug
    const previousData = await service.retrieveSeller(input.id, {
      select: ['id', 'name', 'handle', 'store_status']
    })

    const newHandle = input.name ? toHandle(input.name) : undefined

    // WORKAROUND FOR MEDUSA SQL BUG:
    // service.updateSellers() internally calls list() which triggers the s2.seller_id bug
    // We bypass Medusa's service and update directly via Knex to avoid the problematic SQL
    const updateData: any = {
      ...input,
      ...(newHandle ? { handle: newHandle } : {}),
      updated_at: new Date()
    }
    delete updateData.id // Remove id from update data
    
    await knex('seller')
      .where({ id: input.id })
      .update(updateData)
    
    // Fetch the updated seller with explicit field selection to avoid SQL bugs
    const updatedSellers: SellerDTO = await service.retrieveSeller(input.id, {
      select: ['id', 'name', 'handle', 'description', 'photo', 'email', 'phone', 
               'address_line', 'city', 'state', 'postal_code', 'country_code', 
               'tax_id', 'store_status']
    })

    if (input.store_status) {
      await eventBus.emit({
        name: SellerEvents.STORE_STATUS_CHANGED,
        data: {
          id: input.id,
          store_status: input.store_status
        }
      })
    }

    return new StepResponse(updatedSellers, previousData as UpdateSellerDTO)
  },
  async (previousData: UpdateSellerDTO, { container }) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Use Knex directly to avoid the s2.seller_id SQL bug
    const updateData: any = { ...previousData, updated_at: new Date() }
    delete updateData.id
    
    await knex('seller')
      .where({ id: previousData.id })
      .update(updateData)
  }
)
