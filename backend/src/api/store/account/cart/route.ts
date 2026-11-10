import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/account/cart
 *
 * The signed-in buyer's most recent cart that still has items and wasn't
 * checked out, so signing in on another device brings it back.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const cart = await pg("cart")
    .where("customer_id", req.auth_context.actor_id)
    .whereNull("completed_at")
    .whereNull("deleted_at")
    .whereExists(
      pg("cart_line_item").whereRaw("cart_line_item.cart_id = cart.id").whereNull("cart_line_item.deleted_at")
    )
    .orderBy("updated_at", "desc")
    .first("id")
  res.json({ cart_id: cart?.id ?? null })
}
