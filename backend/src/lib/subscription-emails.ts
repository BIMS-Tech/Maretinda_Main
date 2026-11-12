import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { invoiceAttachment, issueSubscriptionInvoice } from "./invoice"
import { sellerPanelUrl, sendNotice } from "./notify"

const day = (d: any) =>
  new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })

/** After a paid plan activates: issue its invoice and email it to the shop. Never throws. */
export async function sendSubscriptionReceipt(container: any, subscription: any): Promise<void> {
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const seller = await pg("seller").where("id", subscription.seller_id).first()
    if (!seller?.email) return
    const invoice = await issueSubscriptionInvoice(pg, subscription.id)
    await sendNotice(container, {
      to: seller.email,
      subject: `Your Maretinda ${subscription.plan_name} plan is active`,
      eyebrow: "Subscription",
      heading: "Payment received",
      user_name: seller.name,
      paragraphs: [
        `Thank you. Your ${subscription.plan_name} plan is active until ${day(subscription.end_date)}.`,
        invoice
          ? `Your invoice ${invoice.number} is attached to this email.`
          : "You can see your plan and payment in the seller panel.",
      ],
      button: { label: "Open my subscription", url: `${sellerPanelUrl()}/subscription` },
      attachments: invoice ? [invoiceAttachment(invoice)] : undefined,
    })
  } catch (error) {
    console.error("[subscription] receipt email failed:", error instanceof Error ? error.message : error)
  }
}

/** Tells a shop its plan is about to end, or has ended and the shop is closed to buyers. Never throws. */
export async function sendExpiryNotice(container: any, stage: "7d" | "1d" | "ended", subscription: any): Promise<void> {
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const seller = await pg("seller").where("id", subscription.seller_id).first()
    if (!seller?.email) return
    const plan = subscription.is_trial ? "free month" : `${subscription.plan_name} plan`
    const ends = day(subscription.end_date)
    const button = { label: stage === "ended" ? "Choose a plan" : "Renew my plan", url: `${sellerPanelUrl()}/subscription` }

    if (stage === "ended") {
      await sendNotice(container, {
        to: seller.email,
        subject: `Your Maretinda ${plan} has ended`,
        eyebrow: "Subscription",
        heading: "Your plan has ended",
        user_name: seller.name,
        paragraphs: [
          `Your ${plan} ended on ${ends}. Your shop is hidden from buyers and can't take new orders until you choose a plan.`,
          "Your products, orders and messages are safe, and you can still finish the orders you already have.",
        ],
        button,
      })
      return
    }

    const when = stage === "1d" ? "tomorrow" : "in 7 days"
    await sendNotice(container, {
      to: seller.email,
      subject: `Your Maretinda ${plan} ends ${when}`,
      eyebrow: "Subscription",
      heading: `Your plan ends ${when}`,
      user_name: seller.name,
      paragraphs: [
        `Your ${plan} ends on ${ends}. Renew before then to keep your shop open to buyers.`,
        "If you renew early, the days you have left are added to your new period.",
      ],
      button,
    })
  } catch (error) {
    console.error("[subscription] expiry notice failed:", error instanceof Error ? error.message : error)
  }
}
