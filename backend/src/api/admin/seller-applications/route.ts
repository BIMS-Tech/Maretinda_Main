import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getDb(req: any) {
  return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const { status, limit = "50", offset = "0" } = req.query as any

    let query = db("seller_application").orderBy("submitted_at", "desc")
    if (status) query = query.where("status", status)

    const [applications, countResult] = await Promise.all([
      query.clone().limit(parseInt(limit)).offset(parseInt(offset)),
      db("seller_application").modify((q: any) => { if (status) q.where("status", status) }).count("id as count"),
    ])

    res.status(200).json({
      applications,
      count: Number((countResult as any)[0]?.count ?? 0),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to list applications"
    const isTableMissing = msg.includes('relation "seller_application" does not exist') || msg.includes("seller_application")
    if (isTableMissing) {
      res.status(500).json({ message: "seller_application table not found. Run: medusa db:migrate" })
    } else {
      res.status(500).json({ message: msg })
    }
  }
}
