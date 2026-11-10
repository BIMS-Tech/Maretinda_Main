import { Modules } from "@medusajs/framework/utils"

/**
 * Orders a buyer is still waiting on: not cancelled, completed or archived,
 * and with nothing delivered yet. A buyer can't delete their account while
 * one of these is open, or the shop would be left with no one to deliver to.
 */
export async function openOrderIds(pg: any, customerId: string): Promise<string[]> {
  const rows = await pg("order as o")
    .where("o.customer_id", customerId)
    .whereNull("o.deleted_at")
    .whereNotIn("o.status", ["canceled", "completed", "archived"])
    .whereNotExists(
      pg("order_fulfillment as of")
        .join("fulfillment as f", "f.id", "of.fulfillment_id")
        .whereRaw("of.order_id = o.id")
        .whereNull("of.deleted_at")
        .whereNotNull("f.delivered_at")
    )
    .select("o.id")
  return rows.map((r: any) => r.id)
}

/**
 * Deletes a buyer's account: their sign-ins (so the email is free to sign up
 * again), their saved addresses, wishlist and personal details. Orders keep their
 * own copy of the name and address, which the shops and the tax records need.
 */
export async function deleteCustomerAccount(container: any, pg: any, customerId: string) {
  const customerModule = container.resolve(Modules.CUSTOMER)
  const authModule = container.resolve(Modules.AUTH)

  const identities = await pg("auth_identity")
    .whereRaw("app_metadata->>'customer_id' = ?", [customerId])
    .whereNull("deleted_at")
    .select("id")
  if (identities.length) await authModule.deleteAuthIdentities(identities.map((i: any) => i.id))

  const addresses = await customerModule.listCustomerAddresses({ customer_id: customerId })
  if (addresses.length) await customerModule.deleteCustomerAddresses(addresses.map((a: any) => a.id))

  const now = new Date()
  const wishlistIds = (
    await pg("customer_customer_wishlist_wishlist").where("customer_id", customerId).whereNull("deleted_at").select("wishlist_id")
  ).map((r: any) => r.wishlist_id)
  if (wishlistIds.length) {
    await pg("wishlist_wishlist_product_product").whereIn("wishlist_id", wishlistIds).update({ deleted_at: now })
    await pg("wishlist").whereIn("id", wishlistIds).update({ deleted_at: now })
    await pg("customer_customer_wishlist_wishlist").where("customer_id", customerId).update({ deleted_at: now })
  }

  await customerModule.updateCustomers(customerId, {
    email: `deleted-${customerId.toLowerCase()}@deleted.invalid`,
    first_name: null,
    last_name: null,
    phone: null,
    company_name: null,
    metadata: null,
    has_account: false,
  } as any)
  await customerModule.softDeleteCustomers([customerId])
}
