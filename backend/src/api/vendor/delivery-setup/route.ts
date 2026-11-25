import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deliveryStatus, parseDeliveryInput, setUpDelivery } from "../../../lib/delivery-setup"
import { publishHeldProducts } from "../../../lib/held-products"
import { sellerIdOfMember } from "../../../lib/seller-ownership"

const sellerOf = async (req: AuthenticatedMedusaRequest) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const id = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  return id ? pg("seller").where("id", id).whereNull("deleted_at").first() : null
}

/** GET /vendor/delivery-setup — the shop's pickup location, delivery fees, and what is still missing. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const seller = await sellerOf(req)
  if (!seller) return res.status(401).json({ message: "Unauthorized" })
  const status = await deliveryStatus(req.scope, seller.id)
  res.json({
    ...status,
    // Where the seller already told us they are, to start the form with
    suggested_pickup: {
      name: "Main store",
      address_1: seller.address_line ?? "",
      address_2: null,
      city: seller.city ?? "",
      province: seller.state ?? "",
      postal_code: seller.postal_code ?? "",
      phone: seller.phone ?? "",
    },
  })
}

/**
 * POST /vendor/delivery-setup  { pickup: {...}, fees: { standard, express } }
 * The guided setup: creates or updates the pickup location, the Philippines
 * delivery area and the delivery options, then puts any held products live.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const seller = await sellerOf(req)
  if (!seller) return res.status(401).json({ message: "Unauthorized" })
  const input = parseDeliveryInput(req.body)
  if (typeof input === "string") return res.status(400).json({ type: "invalid_data", message: input })
  const status = await setUpDelivery(req.scope, seller, input)
  const published = status.ready ? await publishHeldProducts(req.scope, seller.id) : 0
  res.json({ ...status, published })
}
