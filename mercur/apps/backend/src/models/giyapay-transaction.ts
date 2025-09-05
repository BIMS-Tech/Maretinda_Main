import { model } from "@medusajs/framework/utils"

const GiyaPayTransaction = model.define("giyapay_transaction", {
  id: model.id({ prefix: "giyapay_txn" }).primaryKey(),
  referenceNumber: model.text(),
  orderId: model.text().nullable(),
  amount: model.bigNumber(),
  currency: model.text().default("PHP"),
  status: model.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).default("PENDING"),
  gateway: model.text().default("GCASH"),
  description: model.text().nullable(),
  paymentData: model.json().nullable(), // Store the full payment response
  createdAt: model.dateTime().default(new Date()),
  updatedAt: model.dateTime().default(new Date()),
})

export default GiyaPayTransaction