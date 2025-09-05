import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { capturePaymentWorkflow } from '@medusajs/medusa/core-flows'

import { getVendorOrdersListWorkflow } from '../../../../../../../workflows/order/workflows'

/**
 * @oas [post] /vendor/orders/{id}/payments/{payment_id}/capture
 * operationId: "VendorCapturePayment"
 * summary: "Capture a payment"
 * description: "Allows a vendor to capture a payment (e.g., for COD upon delivery)."
 * x-authenticated: true
 * parameters:
 * - in: path
 *   name: id
 *   required: true
 *   schema:
 *     type: string
 * - in: path
 *   name: payment_id
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
  const { id, payment_id } = req.params

  await capturePaymentWorkflow(req.scope).run({
    input: {
      payment_id,
    },
  })

  const {
    result: [order],
  } = await getVendorOrdersListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      variables: {
        filters: {
          id,
        },
      },
    },
  })

  res.json({ order })
}


