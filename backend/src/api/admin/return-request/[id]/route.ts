import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { adminDecides } from "../../../../lib/return-cases"
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
 * POST /admin/return-request/:id  { status: "refunded" | "canceled", admin_reviewer_note, fault }
 * Maretinda decides an escalated return; the same as /admin/return-cases/:id/decide.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { status, admin_reviewer_note, fault } = (req.body ?? {}) as { status?: string; admin_reviewer_note?: string; fault?: string }
  if (status !== "refunded" && status !== "canceled") {
    return res.status(400).json({ message: "Decide the return as refunded or canceled" })
  }
  const result = await adminDecides(
    req.scope,
    req.params.id,
    { decision: status === "refunded" ? "refund" : "reject", note: admin_reviewer_note, fault },
    req.auth_context.actor_id
  )
  if ("error" in result) return res.status(result.status).json({ message: result.error })
  res.json({ order_return_request: forAdmin(await findRequest(req)), stage: result.stage })
}
