import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ShippingDatabaseService } from '../../../../services/shipping'

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const webhookData = req.body

  console.log('Lalamove webhook received:', webhookData)

  const dbService = new ShippingDatabaseService(req.scope)

  try {
    // Handle different webhook types
    switch (webhookData.type) {
      case 'ORDER_STATUS_CHANGED':
        await handleOrderStatusChange(dbService, webhookData)
        break

      case 'DRIVER_ASSIGNED':
        await handleDriverAssigned(dbService, webhookData)
        break

      case 'ORDER_AMOUNT_CHANGED':
        await handleOrderAmountChange(dbService, webhookData)
        break

      case 'ORDER_REPLACED':
        await handleOrderReplaced(dbService, webhookData)
        break

      case 'WALLET_BALANCE_CHANGED':
        // Handle wallet balance changes if needed
        console.log('Wallet balance changed:', webhookData)
        break

      case 'ORDER_EDITED':
        await handleOrderEdited(dbService, webhookData)
        break

      default:
        console.log('Unknown webhook type:', webhookData.type)
    }

    return res.status(200).json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }
}

async function handleOrderStatusChange(dbService: ShippingDatabaseService, data: any) {
  const { orderId, status } = data.data

  // Find shipping order by Lalamove order ID
  const shippingOrder = await dbService.getShippingOrderByLalamoveId(orderId)
  if (!shippingOrder) {
    console.warn('Shipping order not found for Lalamove order ID:', orderId)
    return
  }

  const updates: any = { status }

  // Update delivery timestamps based on status
  if (status === 'PICKED_UP') {
    updates.estimated_delivery = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
  } else if (status === 'COMPLETED') {
    updates.actual_delivery = new Date().toISOString()
  }

  await dbService.updateShippingOrder(shippingOrder.id, updates)
  console.log(`Order ${orderId} status updated to ${status}`)
}

async function handleDriverAssigned(dbService: ShippingDatabaseService, data: any) {
  const { orderId, driverId, driverName, driverPhone } = data.data

  const shippingOrder = await dbService.getShippingOrderByLalamoveId(orderId)
  if (!shippingOrder) {
    console.warn('Shipping order not found for Lalamove order ID:', orderId)
    return
  }

  await dbService.updateShippingOrder(shippingOrder.id, {
    driver_id: driverId,
    driver_name: driverName,
    driver_phone: driverPhone
  })

  console.log(`Driver ${driverId} assigned to order ${orderId}`)
}

async function handleOrderAmountChange(dbService: ShippingDatabaseService, data: any) {
  const { orderId, priceBreakdown } = data.data

  const shippingOrder = await dbService.getShippingOrderByLalamoveId(orderId)
  if (!shippingOrder) {
    console.warn('Shipping order not found for Lalamove order ID:', orderId)
    return
  }

  await dbService.updateShippingOrder(shippingOrder.id, {
    price: parseFloat(priceBreakdown.total),
    currency: priceBreakdown.currency
  })

  console.log(`Order ${orderId} amount updated to ${priceBreakdown.total} ${priceBreakdown.currency}`)
}

async function handleOrderReplaced(dbService: ShippingDatabaseService, data: any) {
  const { oldOrderId, newOrderId } = data.data

  const shippingOrder = await dbService.getShippingOrderByLalamoveId(oldOrderId)
  if (!shippingOrder) {
    console.warn('Shipping order not found for Lalamove order ID:', oldOrderId)
    return
  }

  await dbService.updateShippingOrder(shippingOrder.id, {
    lalamove_order_id: newOrderId,
    status: 'ASSIGNING_DRIVER' // Reset status for new order
  })

  console.log(`Order ${oldOrderId} replaced with ${newOrderId}`)
}

async function handleOrderEdited(dbService: ShippingDatabaseService, data: any) {
  const { orderId, stops } = data.data

  const shippingOrder = await dbService.getShippingOrderByLalamoveId(orderId)
  if (!shippingOrder) {
    console.warn('Shipping order not found for Lalamove order ID:', orderId)
    return
  }

  // Update delivery details if stops changed
  if (stops && stops.length >= 2) {
    await dbService.updateShippingOrder(shippingOrder.id, {
      delivery_address: stops[1]?.address || shippingOrder.delivery_address,
      delivery_coordinates: stops[1]?.coordinates || shippingOrder.delivery_coordinates,
      recipient_name: stops[1]?.name || shippingOrder.recipient_name,
      recipient_phone: stops[1]?.phone || shippingOrder.recipient_phone
    })
  }

  console.log(`Order ${orderId} edited`)
}
