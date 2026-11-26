import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recoverFromDeposits } from "../lib/seller-charges"

/** Daily: what shops still owe from refunds 14 days on, with no payout to take it from, comes out of their deposit. */
export default async function sellerDepositRecovery(container: MedusaContainer) {
  try {
    const taken = await recoverFromDeposits(container.resolve(ContainerRegistrationKeys.PG_CONNECTION))
    if (taken.length) console.log(`[seller-deposit-recovery] took ₱${taken.reduce((n, t) => n + t.amount, 0).toFixed(2)} from ${new Set(taken.map((t) => t.seller_id)).size} deposit(s)`)
  } catch (error) {
    console.error("[seller-deposit-recovery] failed:", error instanceof Error ? error.message : error)
  }
}

export const config = { name: "seller-deposit-recovery", schedule: "0 2 * * *" } // 10:00 Manila
