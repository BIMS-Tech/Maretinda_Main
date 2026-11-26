import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addDepositEntry, depositBalance, depositMinimum, openCharges, parseDepositEntry } from "../../../../lib/seller-charges"

/** GET /admin/seller-deposits/:id — the shop's security deposit, its history, and what it owes from refunds. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.id
  res.json({
    balance: await depositBalance(pg, id),
    minimum: depositMinimum(),
    entries: await pg("seller_deposit_entry").where("seller_id", id).orderBy("created_at", "desc").limit(100),
    owed: await openCharges(pg, [id]),
  })
}

/** POST /admin/seller-deposits/:id  { kind: received | returned, amount, reference, note } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const entry = parseDepositEntry(req.body)
  if (typeof entry === "string") return res.status(400).json({ type: "invalid_data", message: entry })
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const r = await addDepositEntry(pg, req.params.id, entry, req.auth_context.actor_id)
  if ("error" in r) return res.status(400).json({ type: "not_allowed", message: r.error })
  res.status(201).json(r)
}
