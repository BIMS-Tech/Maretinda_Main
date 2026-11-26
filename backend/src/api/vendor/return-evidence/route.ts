import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { handleEvidenceUpload } from "../../../lib/return-evidence"
import { sellerIdOfMember } from "../../../lib/seller-ownership"

/** POST /vendor/return-evidence — packing proof for disputing a return (multipart "file"). */
export const POST = handleEvidenceUpload(async (req) => {
  const id = await sellerIdOfMember(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION), req.auth_context?.actor_id)
  return id ? { type: "seller", id } : null
})
