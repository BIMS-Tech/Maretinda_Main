export const REPORT_REASONS = [
  "Counterfeit or fake item",
  "Prohibited or unsafe item",
  "Misleading description or photos",
  "Wrong category or price",
  "Trademark or copyright violation",
  "Scam or fraud",
  "Offensive content",
  "Other",
] as const

export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ReportInput = {
  kind: "product" | "seller"
  target: string
  reason: string
  comment: string
  email: string | null
}

/** Checks a buyer's report. Returns the cleaned input, or the message to show them. */
export function parseReport(body: any): ReportInput | string {
  const kind = body?.kind
  if (kind !== "product" && kind !== "seller") return "Choose what you are reporting"
  const target = String(body?.target ?? "").trim()
  if (!target || target.length > 200) return "We could not tell which listing this is about"
  const reason = String(body?.reason ?? "").trim()
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return "Choose a reason"
  const comment = String(body?.comment ?? "").trim()
  if (comment.length < 10) return "Tell us a little more about the problem (at least 10 characters)"
  if (comment.length > 2000) return "Keep the details under 2,000 characters"
  const email = String(body?.email ?? "").trim().toLowerCase()
  if (email && (!EMAIL.test(email) || email.length > 254)) return "Enter a valid email address"
  return { kind, target, reason, comment, email: email || null }
}
