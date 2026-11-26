import { handleEvidenceUpload } from "../../../lib/return-evidence"

/** POST /store/return-evidence — one photo or video for a return claim (multipart "file"). */
export const POST = handleEvidenceUpload(async (req) =>
  req.auth_context?.actor_type === "customer" && req.auth_context.actor_id ? { type: "customer", id: req.auth_context.actor_id } : null
)
