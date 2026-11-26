import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { openReturnCase, parseOpenInput } from "../../../lib/return-cases"

/**
 * POST /store/return-cases — a buyer asks for a return or refund: items and
 * reasons, photos and video, where to send the money, and that the item is
 * unused with its packaging. Replaces Mercur's /store/return-request, which
 * took none of the proof the policy requires.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const input = parseOpenInput(req.body)
  if (typeof input === "string") return res.status(400).json({ type: "invalid_data", message: input })
  const result = await openReturnCase(req.scope, req.auth_context.actor_id, input)
  if ("error" in result) return res.status(result.status).json({ type: "not_allowed", message: result.error })
  res.status(201).json(result)
}
