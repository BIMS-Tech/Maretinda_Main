/**
 * Is a shop ready to sell? The same four parts as the seller panel's setup
 * checklist (hooks/api/setup-tasks): store information, business address,
 * settlement bank details, and legal documents an admin has approved.
 *
 * Until then a seller can set everything up and draft products, but can't
 * publish, run promotions, or take orders: a buyer's money would have nowhere
 * to go and the business isn't vetted yet.
 */

type SellerLike = Record<string, any>

const has = (v: unknown) => !!(v && String(v).trim())

/** Bank details across the current bank_* columns and the older dft_* ones. */
const bankDetails = (s: SellerLike) => {
  const bankName = s.bank_name || s.dft_bank_name
  const isMetrobank = String(bankName ?? "").toLowerCase().includes("metrobank")
  const basic = [bankName, s.account_number || s.dft_account_number, s.account_name || s.dft_beneficiary_name, s.branch_name]
  // Metrobank settles via TAMA; other banks need the DFT transfer block
  const transfer = isMetrobank
    ? []
    : [s.swift_code || s.dft_swift_code, s.beneficiary_address || s.dft_beneficiary_address, s.beneficiary_bank_address || s.dft_bank_address]
  return [...basic, ...transfer].every(has)
}

export function sellerReadiness(seller: SellerLike): { ready: boolean; missing: string[] } {
  const missing: string[] = []
  if (![seller.name, seller.email, seller.phone, seller.description].every(has)) missing.push("store information")
  if (![seller.address_line, seller.city, seller.postal_code, seller.country_code].every(has)) missing.push("business address")
  if (!bankDetails(seller)) missing.push("settlement bank details")
  if (seller.verification_status !== "verified") missing.push("approved legal documents")
  return { ready: missing.length === 0, missing }
}

export const SETUP_REQUIRED_CODE = "setup_required"

export const setupRequiredMessage = (action: string, missing: string[]) =>
  `Finish your store setup to ${action}. Still needed: ${missing.join(", ")}.`
