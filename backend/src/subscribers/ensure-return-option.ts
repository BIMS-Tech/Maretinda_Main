import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ensureReturnOption } from "../lib/return-option"

/**
 * A seller's delivery zone always gets a free return option, so buyers can
 * return what they receive. Mercur emits this after a seller creates or edits
 * a shipping option and the option is linked to the seller.
 */
export default async function ensureReturnOptionHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  try {
    const created = await ensureReturnOption(container, data.id)
    if (created) container.resolve("logger").info(`[return-option] added ${created} beside ${data.id}`)
  } catch (error) {
    container.resolve("logger").error(`[return-option] couldn't add a return option beside ${data.id}: ${(error as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "algolia.intermediate.shipping_option.changed",
}
