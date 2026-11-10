/**
 * The GiyaPay methods checkout has a button for. Admins choose from these,
 * and a method stored before (PayMaya) isn't offered, so the config never
 * promises something buyers can't pick.
 */
export const CHECKOUT_METHODS = ["INSTAPAY", "MASTERCARD/VISA", "GCASH", "QRPH", "WECHATPAY", "UNIONPAY"] as const

export type CheckoutMethod = (typeof CHECKOUT_METHODS)[number]

export const offeredMethods = (enabled?: string[] | null): CheckoutMethod[] =>
  enabled
    ? CHECKOUT_METHODS.filter((m) => enabled.includes(m))
    : [...CHECKOUT_METHODS]
