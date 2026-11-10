import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteCustomerAccount, openOrderIds } from "../../../lib/account-deletion"

/**
 * DELETE /store/account
 *
 * The signed-in buyer deletes their own account. Refused while an order is
 * still on its way.
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  if ((await openOrderIds(pg, customerId)).length) {
    res.status(409).json({
      type: "not_allowed",
      message:
        "You still have an order on its way. You can delete your account once it has arrived or been cancelled.",
    })
    return
  }

  await deleteCustomerAccount(req.scope, pg, customerId)
  res.json({ deleted: true })
}
