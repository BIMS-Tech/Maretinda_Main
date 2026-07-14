/**
 * Business verification rules for sellers.
 *
 * TIN (tax_id) and the org-specific documents are collected in the seller
 * Store settings (not at registration). A seller becomes eligible for the
 * "Verified" badge only once these are complete AND an admin confirms them.
 *
 * Keep the required-document keys in sync with the seller panel's
 * business-documents definitions.
 */

export const NEEDS_SIGNATORY = [
  "Corporation",
  "Partnership",
  "Cooperative",
  "Association",
  "Government",
]

// Required document keys per organization type. Mirrors the seller panel list.
export const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  "Sole Proprietorship": ["dti_registration", "mayors_permit", "bir_certificate", "valid_id"],
  Corporation: ["board_resolution", "articles_bylaws", "sec_registration", "mayors_permit", "bir_certificate", "valid_id"],
  Partnership: ["partnership_agreement", "sec_registration", "mayors_permit", "bir_certificate", "valid_id"],
  Cooperative: ["cda_registration", "bylaws", "mayors_permit", "bir_certificate", "valid_id"],
  Association: ["registration_certificate", "bylaws", "board_resolution", "valid_id"],
  Government: ["authorization_letter", "valid_id"],
  Transportation: ["business_permit", "bir_certificate", "valid_id"],
  Others: ["business_permit", "bir_certificate", "valid_id"],
}

export type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected"

type DocsInput = Record<string, unknown> | string | null | undefined

function parseDocs(documents: DocsInput): Record<string, string> {
  if (!documents) return {}
  if (typeof documents === "string") {
    try {
      return JSON.parse(documents) || {}
    } catch {
      return {}
    }
  }
  return documents as Record<string, string>
}

/**
 * Are the seller's business details complete enough to request verification?
 * Requires a TIN and every required document for their organization type.
 * Unknown/blank org types fall back to requiring a TIN + at least one document.
 */
export function isVerificationComplete(input: {
  tax_id?: string | null
  form_of_organization?: string | null
  business_documents?: DocsInput
}): boolean {
  const hasTin = !!(input.tax_id && String(input.tax_id).trim())
  if (!hasTin) return false

  const docs = parseDocs(input.business_documents)
  const uploaded = (key: string) => !!(docs[key] && String(docs[key]).trim())

  const org = (input.form_of_organization || "").trim()
  const required = REQUIRED_DOCUMENTS[org]

  if (!required) {
    // Unknown org type — require at least one uploaded document.
    return Object.values(docs).some((v) => !!(v && String(v).trim()))
  }
  return required.every(uploaded)
}

/**
 * Given the seller's current status and whether details are now complete,
 * derive the next status after a seller-side update.
 *
 * - Sellers can never set themselves to "verified" (admin only).
 * - Completing details moves unverified/rejected -> pending_review.
 * - Removing details moves pending_review -> unverified.
 * - An already-"verified" seller stays verified (admin revokes explicitly).
 */
export function deriveStatusAfterSellerUpdate(
  current: VerificationStatus | string | null | undefined,
  complete: boolean
): VerificationStatus {
  const status = (current || "unverified") as VerificationStatus
  if (status === "verified") return "verified"
  if (complete) return "pending_review"
  return "unverified"
}
