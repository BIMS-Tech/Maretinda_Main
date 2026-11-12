import { Modules } from "@medusajs/framework/utils"
import { BRAND_NAME } from "./brand"

export type Notice = {
  to: string | null | undefined
  subject: string
  eyebrow?: string
  heading: string
  user_name?: string | null
  paragraphs: string[]
  button?: { label: string; url: string } | null
  note?: string
  attachments?: { filename: string; content: string; content_type: string; disposition?: string }[]
}

export const storefrontUrl = () =>
  (process.env.STOREFRONT_URL || process.env.STORE_URL || "https://maretinda.com").replace(/\/$/, "")

export const sellerPanelUrl = () =>
  (process.env.VENDOR_URL || process.env.SELLER_PANEL_URL || "https://seller.maretinda.com").replace(/\/$/, "")

/**
 * Sends one branded notice by email. Never throws: an email that fails must
 * not undo the order, approval or payment it reports. Returns whether it went.
 */
export async function sendNotice(container: any, notice: Notice): Promise<boolean> {
  if (!notice.to) return false
  try {
    await container.resolve(Modules.NOTIFICATION).createNotifications({
      to: notice.to,
      channel: "email",
      template: "messageEmailTemplate",
      content: { subject: notice.subject },
      data: {
        data: {
          store_name: BRAND_NAME,
          eyebrow: notice.eyebrow,
          heading: notice.heading,
          user_name: notice.user_name || undefined,
          paragraphs: notice.paragraphs,
          button: notice.button ?? null,
          note: notice.note,
        },
      },
      ...(notice.attachments?.length ? { attachments: notice.attachments } : {}),
    })
    return true
  } catch (error) {
    console.error(`[notify] "${notice.subject}" to ${notice.to} failed:`, error instanceof Error ? error.message : error)
    return false
  }
}
