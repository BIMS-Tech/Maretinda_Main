import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/newsletter-subscribers — the newsletter list, newest first.
 * `?format=csv` downloads it for a mailing tool.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const subscribers = await pg("newsletter_subscriber").orderBy("created_at", "desc").select("email", "source", "created_at")

  if ((req.query as any).format === "csv") {
    const lines = ["email,signed_up_at", ...subscribers.map((s: any) => `${s.email},${new Date(s.created_at).toISOString()}`)]
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader("Content-Disposition", 'attachment; filename="newsletter-subscribers.csv"')
    return res.send(lines.join("\n"))
  }
  res.json({ subscribers, count: subscribers.length })
}
