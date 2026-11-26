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
  // Where the seller already told us they are, to start the form with. The
  // application keeps street, barangay, city and province apart; the shop's
  // own address joins them into one line.
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const app = await pg("seller_application")
    .where("seller_id", seller.id)
    .orderBy("submitted_at", "desc")
    .first("business_street", "business_barangay", "business_city", "business_province", "business_postal_code", "mobile_number")
  res.json({
    ...status,
    suggested_pickup: {
      name: "Main store",
      address_1: app?.business_street || seller.address_line || "",
      address_2: app?.business_barangay || null,
      city: app?.business_city || seller.city || "",
      province: app?.business_province || seller.state || "",
      postal_code: app?.business_postal_code || seller.postal_code || "",
      phone: seller.phone || app?.mobile_number || "",
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
