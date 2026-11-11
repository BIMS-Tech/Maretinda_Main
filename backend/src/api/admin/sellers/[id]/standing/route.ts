import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isSuspended } from "../../../../../lib/seller-plan"
import { sellerReadiness } from "../../../../../lib/seller-readiness"

/**
 * GET /admin/sellers/:id/standing
 * Whether a shop can sell right now and why not: its running plan and its
 * store setup, by the same rules buyers' carts and the seller panel use.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const seller = await pg("seller").where("id", req.params.id).whereNull("deleted_at").first()
  if (!seller) return res.status(404).json({ message: "Seller not found" })

  const plan = await pg("seller_subscription")
    .where({ seller_id: seller.id, status: "active" })
    .where("end_date", ">", new Date())
    .orderBy("end_date", "desc")
    .first("plan_name", "price", "billing_period", "is_trial", "end_date")
  const setup = sellerReadiness(seller)

  res.json({
    open: !isSuspended(seller) && !!plan && setup.ready,
    suspended: isSuspended(seller),
    plan: plan
      ? {
          name: plan.plan_name,
          trial: !!plan.is_trial,
          price: Number(plan.price ?? 0),
          billing_period: plan.billing_period ?? "monthly",
          ends_at: plan.end_date,
        }
      : null,
    setup,
    verification_status: seller.verification_status ?? "unverified",
  })
}
