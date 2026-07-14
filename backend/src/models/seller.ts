import { model } from "@medusajs/framework/utils"

/**
 * Seller model with custom bank/settlement fields
 * Extends the base Seller entity from @mercurjs/b2c-core
 */
const Seller = model.define("seller", {
  // Bank settlement fields
  bank_name: model.text().nullable(),
  account_number: model.text().nullable(),
  account_name: model.text().nullable(),
  branch_name: model.text().nullable(),
  swift_code: model.text().nullable(),
  beneficiary_address: model.text().nullable(),
  beneficiary_bank_address: model.text().nullable(),
  
  // Legacy DFT bank fields
  dft_bank_name: model.text().nullable(),
  dft_bank_code: model.text().nullable(),
  dft_swift_code: model.text().nullable(),
  dft_bank_address: model.text().nullable(),
  dft_beneficiary_name: model.text().nullable(),
  dft_beneficiary_code: model.text().nullable(),
  dft_beneficiary_address: model.text().nullable(),
  dft_account_number: model.text().nullable(),

  // Business verification (collected in Store settings, confirmed by an admin)
  form_of_organization: model.text().nullable(),
  business_documents: model.json().nullable(),
  verification_status: model.text().default("unverified"),
  verified_at: model.dateTime().nullable(),
  verification_notes: model.text().nullable(),
})

export default Seller


