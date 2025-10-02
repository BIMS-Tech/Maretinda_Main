import { model } from "@medusajs/framework/utils"

export const DftConfiguration = model.define("dft_configuration", {
  id: model.id({ prefix: "dft_conf" }).primaryKey(),
  seller_id: model.text(),
  
  // Bank Information
  bank_name: model.text(),
  bank_code: model.text().nullable(),
  swift_code: model.text(),
  bank_address: model.text(),
  
  // Beneficiary Information  
  beneficiary_name: model.text(),
  beneficiary_code: model.text(),
  beneficiary_address: model.text(),
  account_number: model.text(),
  
  // Remittance Configuration
  remittance_type: model.text().default("TT"), // Transfer Type (TT, etc.)
  currency: model.text().default("PHP"),
  charge_type: model.text().default("0"), // 0 = Charge to sender
  
  // Source Account (Marketplace's account)
  source_account: model.text(),
  
  // Status and validation
  is_verified: model.boolean().default(false),
  verification_date: model.dateTime().nullable(),
  created_by: model.text().nullable(), // Admin who verified
  
  // Additional metadata
  notes: model.text().nullable()
})
