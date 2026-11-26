import { backendUrl, sdk } from "../../lib/client"

export type Line = { label: string; amount: number }
export type Payout = { method: "gcash" | "maya" | "bank"; account_name: string; account_number: string; bank_name?: string | null } | null

export type Refund = {
  id: string
  kind: "return" | "cancellation" | "failed_delivery"
  status: "due" | "paid" | "void"
  amount: number
  refunded: Line[]
  deductions: Line[]
  seller_charges: Line[]
  fault: string | null
  due_by: string | null
  business_days: string
  payout_label: string | null
  payout: Payout
  note: string | null
  paid_at: string | null
  paid_amount: number | null
  paid_method: string | null
  reference: string | null
  has_receipt: boolean
  order_id?: string
  request_id?: string | null
  display_id?: number | null
  seller_name?: string | null
  buyer?: string | null
  payment?: "online" | "cod"
}

export type CaseRow = {
  request_id: string
  order_id: string
  display_id: number | null
  stage: string
  stage_label: string
  payment: "online" | "cod"
  respond_by: string
  decide_by: string | null
  escalated_by: string | null
  created_at: string
  seller_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
}

export type Evidence = { id: string; kind: "photo" | "video" }

export type CaseDetail = {
  request_id: string
  order_id: string
  order_number: number | null
  stage: string
  stage_label: string
  payment: "online" | "cod"
  reasons: { code: string; label: string }[]
  items: { title: string; variant_title: string | null; thumbnail: string | null; unit_price: number; quantity: number; reason: string | null }[]
  evidence: Evidence[]
  seller_evidence: Evidence[]
  buyer_note: string | null
  seller_note: string | null
  decision_note: string | null
  resolution: string | null
  respond_by: string
  approved_at: string | null
  ship_back_by: string | null
  return_courier: string | null
  return_tracking: string | null
  return_shipping: number | null
  shipped_back_at: string | null
  received_at: string | null
  escalated_at: string | null
  escalated_by: string | null
  decide_by: string | null
  created_at: string
  payout_label: string | null
  payout: Payout
  fault: string | null
  seller: { name: string; email: string } | null
  refund: Refund | null
}

export type Cancellation = {
  id: string
  order_id: string
  display_id: number | null
  reason: string
  status: "pending" | "approved" | "rejected"
  payout_label: string | null
  decision_note: string | null
  created_at: string
  seller_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
}

export const peso = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
export const day = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—"
export const when = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"

export const api = <T,>(path: string, body?: unknown) =>
  sdk.client.fetch<T>(path, body === undefined ? { method: "GET" } : { method: "POST", body: body as any })

const token = () => localStorage.getItem("medusa_admin_jwt")

/** Private files (evidence, receipts) need the admin's sign-in, so they're fetched as blobs. */
export async function privateFile(path: string) {
  const t = token()
  const res = await fetch(`${backendUrl}${path}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} })
  if (!res.ok) throw new Error("Couldn't load the file")
  return URL.createObjectURL(await res.blob())
}

export async function uploadReceipt(file: File): Promise<string> {
  const form = new FormData()
  form.append("file", file)
  const t = token()
  const res = await fetch(`${backendUrl}/admin/refund-receipts`, { method: "POST", body: form, headers: t ? { Authorization: `Bearer ${t}` } : {} })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || "Upload failed")
  return json.receipt_id
}

export const PAYOUT_METHODS: Record<string, string> = { gcash: "GCash", maya: "Maya", bank: "Bank (InstaPay)" }
