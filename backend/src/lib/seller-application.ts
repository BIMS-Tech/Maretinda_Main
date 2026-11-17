import { toPhMobile } from "./ph-mobile"

/**
 * What a seller application must contain, checked on the server whatever the
 * form sends. The seller panel's registration chat asks for exactly these.
 */

/** Bump when the Seller Agreement or privacy notice the applicant agrees to changes. */
export const SELLER_TERMS_VERSION = "2026-06-23"

export const ORG_TYPES = [
  "Sole Proprietorship",
  "Corporation",
  "Partnership",
  "Cooperative",
  "Association",
  "Government",
  "Transportation",
  "Others",
] as const

/** Organisations that act through an authorized signatory rather than an owner. */
export const NEEDS_SIGNATORY = ["Corporation", "Partnership", "Cooperative", "Association", "Government"]

export const PRODUCT_COUNTS = ["1–10", "11–50", "51–200", "More than 200"] as const

export const PRODUCT_SOURCES = [
  "I make them myself",
  "My own brand",
  "Authorized reseller or distributor of other brands",
  "Unbranded or general merchandise",
] as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const text = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "")

/** A PH TIN: 9 digits, optionally followed by a 3- or 5-digit branch code. */
export function normalizeTin(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "")
  if (![9, 12, 14].includes(digits.length)) return null
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)]
  if (digits.length > 9) parts.push(digits.slice(9))
  return parts.join("-")
}

export type ApplicationInput = {
  first_name: string
  last_name: string
  email: string
  mobile_number: string
  designation: string | null
  form_of_organization: string
  business_name: string
  shop_name: string
  business_tin: string
  vat_registered: boolean
  business_province: string
  business_city: string
  business_barangay: string | null
  business_street: string
  business_postal_code: string
  business_address: string
  main_category: string
  product_count: string
  product_source: string
  sells_regulated: boolean
  store_links: string | null
  signatory_first_name: string | null
  signatory_middle_name: string | null
  signatory_last_name: string | null
  signatory_email: string | null
  signatory_mobile: string | null
  promo_code: string | null
}

/** The cleaned application, or the first problem to show the applicant. */
export function parseApplication(body: any): ApplicationInput | string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid application"

  const first_name = text(body.first_name, 100)
  const last_name = text(body.last_name, 100)
  if (!first_name || !last_name) return "Enter your first and last name"

  const email = text(body.email, 254).toLowerCase()
  if (!EMAIL.test(email)) return "Please enter a valid email address"

  const mobile = toPhMobile(text(body.mobile_number, 40))
  if (!mobile) return "Enter a Philippine mobile number, like 0917 123 4567"

  const form_of_organization = text(body.form_of_organization, 50)
  if (!(ORG_TYPES as readonly string[]).includes(form_of_organization)) return "Choose how your business is registered"

  const business_name = text(body.business_name, 150)
  if (!business_name) return "Enter the registered business name"
  const shop_name = text(body.shop_name, 60) || business_name.slice(0, 60)

  const business_tin = normalizeTin(body.business_tin)
  if (!business_tin) return "Enter the business TIN: 9 digits, plus the branch code if you have one (e.g. 123-456-789-00000)"
  if (typeof body.vat_registered !== "boolean") return "Tell us whether the business is VAT-registered"

  const business_province = text(body.business_province, 100)
  const business_city = text(body.business_city, 100)
  const business_street = text(body.business_street, 200)
  const business_barangay = text(body.business_barangay, 100) || null
  const business_postal_code = text(body.business_postal_code, 10)
  if (!business_province || !business_city || !business_street) return "Enter the business address: province, city and street"
  if (!/^\d{4}$/.test(business_postal_code)) return "Enter the 4-digit ZIP code of the business address"

  const main_category = text(body.main_category, 100)
  if (!main_category) return "Choose what you mainly sell"
  const product_count = text(body.product_count, 30)
  if (!(PRODUCT_COUNTS as readonly string[]).includes(product_count)) return "Choose roughly how many products you will list"
  const product_source = text(body.product_source, 100)
  if (!(PRODUCT_SOURCES as readonly string[]).includes(product_source)) return "Tell us where your products come from"
  if (typeof body.sells_regulated !== "boolean") return "Tell us whether you will sell food, cosmetics or health products"

  let signatory_first_name: string | null = null
  let signatory_last_name: string | null = null
  if (NEEDS_SIGNATORY.includes(form_of_organization)) {
    signatory_first_name = text(body.signatory_first_name, 100) || null
    signatory_last_name = text(body.signatory_last_name, 100) || null
    if (!signatory_first_name || !signatory_last_name) return "Enter the name of the authorized signatory"
  }
  const signatory_email = text(body.signatory_email, 254).toLowerCase() || null
  if (signatory_email && !EMAIL.test(signatory_email)) return "Enter a valid email for the signatory"

  if (body.terms_accepted !== true) return "Please agree to the Seller Agreement to apply"
  if (body.privacy_consent !== true) return "Please agree to the privacy notice to apply"

  return {
    first_name,
    last_name,
    email,
    mobile_number: mobile,
    designation: text(body.designation, 100) || (form_of_organization === "Sole Proprietorship" ? "Owner" : null),
    form_of_organization,
    business_name,
    shop_name,
    business_tin,
    vat_registered: body.vat_registered,
    business_province,
    business_city,
    business_barangay,
    business_street,
    business_postal_code,
    business_address: [business_street, business_barangay, business_city, `${business_province} ${business_postal_code}`]
      .filter(Boolean)
      .join(", "),
    main_category,
    product_count,
    product_source,
    sells_regulated: body.sells_regulated,
    store_links: text(body.store_links, 1000) || null,
    signatory_first_name,
    signatory_middle_name: signatory_first_name ? text(body.signatory_middle_name, 100) || null : null,
    signatory_last_name,
    signatory_email,
    signatory_mobile: toPhMobile(text(body.signatory_mobile, 40)) ?? (text(body.signatory_mobile, 40) || null),
    promo_code: text(body.promo_code, 40).toUpperCase() || null,
  }
}
