import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { FINAL_STAGES, openReturnCase, parseOpenInput, STAGE_LABELS, Stage } from "../../../lib/return-cases"

/**
 * POST /store/return-cases — a buyer asks for a return or refund: items and
 * reasons, photos and video, where to send the money, and that the item is
 * unused with its packaging. Replaces Mercur's /store/return-request, which
 * took none of the proof the policy requires. A refusal because the order
 * already has a return carries its code and request_id, to link to it.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const input = parseOpenInput(req.body)
  if (typeof input === "string") return res.status(400).json({ type: "invalid_data", message: input })
  const result = await openReturnCase(req.scope, req.auth_context.actor_id, input)
  if ("error" in result) {
    return res.status(result.status).json({
      type: "not_allowed",
      message: result.error,
      ...(result.code ? { code: result.code, request_id: result.request_id } : {}),
    })
  }
  res.status(201).json(result)
}

/**
 * GET /store/return-cases?order_id= — the buyer's returns, newest first: where
 * each stands, whether it is still open, and which items it covers. The order
 * and return pages use it to say a return was already asked for.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const q = pg("return_case").where("customer_id", req.auth_context.actor_id).orderBy("created_at", "desc").limit(100)
  if (typeof req.query.order_id === "string" && req.query.order_id) q.where("order_id", req.query.order_id)
  const cases = await q.select("request_id", "order_id", "stage", "created_at")
  const lines = cases.length
    ? await pg("order_return_request_line_item")
        .whereIn("return_request_id", cases.map((c: any) => c.request_id))
        .whereNull("deleted_at")
        .select("return_request_id", "line_item_id", "quantity")
    : []
  res.json({
    return_cases: cases.map((c: any) => ({
      request_id: c.request_id,
      order_id: c.order_id,
      stage: c.stage,
      stage_label: STAGE_LABELS[c.stage as Stage] ?? c.stage,
      open: !FINAL_STAGES.includes(c.stage),
      created_at: c.created_at,
      items: lines
        .filter((l: any) => l.return_request_id === c.request_id)
        .map((l: any) => ({ line_item_id: l.line_item_id, quantity: Number(l.quantity) })),
    })),
  })
}
