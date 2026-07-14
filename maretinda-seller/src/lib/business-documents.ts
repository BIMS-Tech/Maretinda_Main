/**
 * Business document requirements per organization type.
 * Kept in sync with the backend `REQUIRED_DOCUMENTS` map
 * (backend/src/lib/seller-verification.ts).
 */

export const ORG_TYPES = [
  "Sole Proprietorship",
  "Corporation",
  "Partnership",
  "Cooperative",
  "Association",
  "Government",
  "Transportation",
  "Others",
]

export const ORG_DOCUMENTS: Record<string, { key: string; label: string }[]> = {
  "Sole Proprietorship": [
    { key: "dti_registration", label: "DTI Registration Certificate" },
    { key: "mayors_permit", label: "Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government ID" },
  ],
  Corporation: [
    { key: "board_resolution", label: "Board Resolution" },
    { key: "articles_bylaws", label: "Articles of Incorporation / By-Laws" },
    { key: "sec_registration", label: "SEC Registration Certificate" },
    { key: "mayors_permit", label: "DTI / Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs of Signatories" },
  ],
  Partnership: [
    { key: "partnership_agreement", label: "Partnership Agreement" },
    { key: "sec_registration", label: "SEC Registration Certificate" },
    { key: "mayors_permit", label: "Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs of Partners" },
  ],
  Cooperative: [
    { key: "cda_registration", label: "CDA Registration Certificate" },
    { key: "bylaws", label: "By-Laws" },
    { key: "mayors_permit", label: "Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs" },
  ],
  Association: [
    { key: "registration_certificate", label: "Registration Certificate" },
    { key: "bylaws", label: "By-Laws / Constitution" },
    { key: "board_resolution", label: "Board Resolution" },
    { key: "valid_id", label: "Valid Government IDs of Officers" },
  ],
  Government: [
    { key: "authorization_letter", label: "Official Authorization Letter" },
    { key: "valid_id", label: "Government ID of Authorized Representative" },
  ],
  Transportation: [
    { key: "business_permit", label: "Business / Franchise Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs" },
  ],
  Others: [
    { key: "business_permit", label: "Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government ID" },
  ],
}

export function requiredDocsFor(org?: string): { key: string; label: string }[] {
  return (org && ORG_DOCUMENTS[org]) || []
}

/** Is TIN set and every required document uploaded for this org type? */
export function isVerificationComplete(seller: {
  tax_id?: string
  form_of_organization?: string
  business_documents?: Record<string, string>
}): boolean {
  if (!seller.tax_id || !seller.tax_id.trim()) return false
  const docs = seller.business_documents || {}
  const required = requiredDocsFor(seller.form_of_organization)
  if (required.length === 0) {
    return Object.values(docs).some((v) => !!(v && String(v).trim()))
  }
  return required.every((d) => !!(docs[d.key] && String(docs[d.key]).trim()))
}
