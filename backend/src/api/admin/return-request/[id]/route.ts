import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderReturnRequestWorkflow } from "@mercurjs/requests/workflows"
import { RETURN_REQUEST_FIELDS, forAdmin } from "../helpers"

const findRequest = async (req: AuthenticatedMedusaRequest) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_return_request",
    fields: RETURN_REQUEST_FIELDS,
    filters: { id: req.params.id },
  })
  return data[0] as any
}

/** GET /admin/return-request/:id */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const request = await findRequest(req)
  if (!request) return res.status(404).json({ message: "Return request not found" })
  res.json({ order_return_request: forAdmin(request) })
}

/**
 * POST /admin/return-request/:id  { status: "refunded" | "canceled", admin_reviewer_note }
 * Maretinda decides a return the seller escalated. Refunding runs the same
 * workflow as a seller accepting it: a return is opened on the order and
 * received into the seller's warehouse.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { status, admin_reviewer_note } = (req.body ?? {}) as { status?: string; admin_reviewer_note?: string }
  if (status !== "refunded" && status !== "canceled") {
    return res.status(400).json({ message: "Decide the return as refunded or canceled" })
  }
  if (typeof admin_reviewer_note !== "string" || !admin_reviewer_note.trim()) {
    return res.status(400).json({ message: "Add a note: the buyer and seller see why" })
  }

  const request = await findRequest(req)
  if (!request) return res.status(404).json({ message: "Return request not found" })
  if (request.status !== "escalated") {
    return res.status(400).json({ message: "Only a return the seller escalated can be decided here" })
  }

  const decision = {
    id: request.id,
    status,
    admin_reviewer_note: admin_reviewer_note.trim(),
    admin_reviewer_id: req.auth_context.actor_id,
    admin_review_date: new Date(),
  }

  let result: any
  if (status === "refunded") {
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const link = request.seller?.id
      ? await pg("seller_seller_stock_location_stock_location")
          .where({ seller_id: request.seller.id })
          .whereNull("deleted_at")
          .first("stock_location_id")
      : null
    ;({ result } = await updateOrderReturnRequestWorkflow.run({
      container: req.scope,
      input: { ...decision, ...(link && { location_id: link.stock_location_id }) } as any,
    }))
  } else {
    // Turning a return down opens no return on the order, and Mercur's
    // workflow assumes one exists, so update the request on its own
    ;[result] = await (req.scope.resolve("order_return") as any).updateOrderReturnRequests([decision])
  }

  res.json({ order_return_request: forAdmin({ ...request, ...result }) })
}
