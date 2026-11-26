import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { documentLabel, invoiceAttachment, issueFeesInvoice } from "../lib/invoice"
import { sellerPanelUrl, sendNotice } from "../lib/notify"

/** "2026-10" for any moment in November 2026, Manila time. */
export const previousMonth = (now = new Date()) => {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit" }).format(now).split("-").map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`
}

/**
 * On the 1st: each shop gets the platform's document for what last month's
 * payouts deducted (payment processing and the payout fee), as the e-invoice
 * template's "Platform Services Invoice". Running twice issues nothing new.
 */
export default async function monthlyFeeInvoices(container: MedusaContainer) {
  const pg: any = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const month = previousMonth()
  const from = new Date(`${month}-01T00:00:00+08:00`)
  const to = new Date(from)
  to.setUTCMonth(to.getUTCMonth() + 1)
  try {
    const sellers: string[] = await pg("settlement_line")
      .whereNot("kind", "legacy")
      .where("created_at", ">=", from)
      .where("created_at", "<", to)
      .distinct("seller_id")
      .pluck("seller_id")
    for (const sellerId of sellers) {
      const already = await pg("invoice").where({ kind: "fees", reference_id: `${sellerId}:${month}` }).first("id")
      const doc = await issueFeesInvoice(pg, sellerId, month)
      if (!doc || already) continue
      const seller = await pg("seller").where("id", sellerId).first("name", "email")
      if (!seller?.email) continue
      await sendNotice(container, {
        to: seller.email,
        subject: `Your Maretinda ${documentLabel(doc.document)} for ${month}`,
        eyebrow: "Billing",
        heading: "Fees deducted from your payouts",
        user_name: seller.name,
        paragraphs: [
          `Attached is ${doc.number}: the payment processing and payout fees taken from your payouts last month, ₱${doc.total.toFixed(2)} in all.`,
          "Nothing to pay: these were already deducted.",
        ],
        button: { label: "See your payouts", url: `${sellerPanelUrl()}/invoices` },
        attachments: [invoiceAttachment(doc)],
      })
    }
  } catch (error) {
    console.error("[monthly-fee-invoices] failed:", error instanceof Error ? error.message : error)
  }
}

export const config = {
  name: "monthly-fee-invoices",
  schedule: "0 0 1 * *", // the 1st, 08:00 Manila
}
