import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { capturePaymentWorkflow } from '@medusajs/medusa/core-flows'

import { getVendorOrdersListWorkflow } from '../../../../../workflows/order/workflows'
import { markSplitOrderPaymentsAsCapturedWorkflow } from '../../../../../workflows/split-order-payment/workflows'

/**
 * @oas [post] /vendor/orders/{id}/capture
 * operationId: "VendorCaptureOrderPayments"
 * summary: "Capture authorized payments for an order"
 * description: "Allows a vendor to capture authorized payments (e.g., COD upon delivery) for an order without needing individual payment IDs."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   schema:
 *     type: string
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Vendor Orders
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  // Load order with split_order_payment to access the payment_collection_id
  const {
    result: [order],
  } = await getVendorOrdersListWorkflow(req.scope).run({
    input: {
      fields: ['split_order_payment.*'],
      variables: {
        filters: { id },
      },
    },
  })

  const paymentCollectionId = (order as any)?.split_order_payment?.payment_collection_id
  if (!paymentCollectionId) {
    return res.json({ order })
  }

  // Fetch payment ids from the collection
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: collection } = await query.graph({
    entity: 'payment_collection',
    fields: ['payments.id'],
    filters: { id: paymentCollectionId },
  })

  const paymentIds: string[] = Array.isArray(collection?.payments)
    ? collection.payments.map((p: any) => p.id).filter(Boolean)
    : []

  // Capture all payments sequentially
  for (const payment_id of paymentIds) {
    await capturePaymentWorkflow(req.scope).run({
      input: { payment_id },
    })
  }

  // Update split_order_payment aggregate as captured
  await markSplitOrderPaymentsAsCapturedWorkflow(req.scope).run({
    input: paymentCollectionId,
  })

  const {
    result: [updatedOrder],
  } = await getVendorOrdersListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters: { id },
      },
    },
  })

  res.json({ order: updatedOrder })
}


