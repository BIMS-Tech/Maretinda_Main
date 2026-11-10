import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService, ModerationStatus } from "../../../services/reels"
import { clampInt } from "../../../lib/pagination"

/**
 * GET /admin/reels — every seller reel for moderation, newest first.
 * Optional `moderation_status` (visible | hidden) and `q` (title or shop).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.query as Record<string, string | undefined>
  const status = ["visible", "hidden"].includes(query.moderation_status ?? "")
    ? (query.moderation_status as ModerationStatus)
    : undefined
  const { reels, count } = await getReelsService(req.scope as any).listForModeration({
    moderation_status: status,
    q: query.q?.trim().slice(0, 100) || undefined,
    limit: clampInt(query.limit, { fallback: 20, min: 1, max: 100 }),
    offset: clampInt(query.offset, { fallback: 0, max: 100000 }),
  })
  res.json({ reels, count })
}
