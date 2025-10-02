import { model } from "@medusajs/framework/utils"

export enum DftTransactionStatus {
  PENDING = "pending",
  INCLUDED = "included", 
  PROCESSED = "processed",
  FAILED = "failed",
  EXCLUDED = "excluded"
}

export const DftTransaction = model.define("dft_transaction", {
  id: model.id({ prefix: "dft_txn" }).primaryKey(),
  
  // DFT Generation reference
  dft_generation_id: model.text(),
  
  // Transaction references
  payout_id: model.text(), // Reference to payout record
  order_id: model.text().nullable(), // Reference to order if applicable
  seller_id: model.text(),
  
  // DFT Line data
  amount: model.bigNumber(),
  currency: model.text().default("PHP"),
  
  // Beneficiary details (copied from DftConfiguration at time of generation)
  beneficiary_name: model.text(),
  beneficiary_code: model.text(), 
  beneficiary_account: model.text(),
  beneficiary_address: model.text(),
  swift_code: model.text(),
  bank_address: model.text(),
  
  // Transaction metadata
  remittance_type: model.text().default("TT"),
  source_account: model.text(),
  purpose: model.text(), // "DFT <date>"
  charge_type: model.text().default("0"),
  
  // Status and tracking
  status: model.enum(DftTransactionStatus).default(DftTransactionStatus.PENDING),
  line_number: model.number().nullable(), // Line number in DFT file
  transaction_date: model.dateTime(),
  
  // Error handling
  error_message: model.text().nullable(),
  retry_count: model.number().default(0)
})
