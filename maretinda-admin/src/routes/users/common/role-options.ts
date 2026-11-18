import type { AdminRole } from "../../../hooks/api/admin-access"

/** What each admin role may change. Every role can see everything except settings, bank files and the audit log. */
export const ROLE_OPTIONS: { value: AdminRole; label: string; hint: string }[] = [
  { value: "owner", label: "Owner", hint: "Everything, including settings, admin users and roles, API keys and the audit log." },
  { value: "manager", label: "Manager", hint: "Sellers, products, orders, returns, promotions, flash sales and the content moderation of Support." },
  { value: "finance", label: "Finance", hint: "Payouts, bank files, invoices, COD remittances, GiyaPay and subscriptions." },
  { value: "support", label: "Support", hint: "Returns, listing reports, reviews, reels, customers and chat." },
  { value: "viewer", label: "Viewer", hint: "Can look, can't change anything." },
]
