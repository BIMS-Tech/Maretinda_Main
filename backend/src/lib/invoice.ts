import crypto from "crypto"
import { storefrontUrl } from "./notify"
import { renderInvoicePdf } from "./invoice-pdf"

/**
 * Invoices to the company's e-invoice template (24 November 2026; RR 7-2024
 * contents, RMC 98-2026 e-invoicing). Three documents, never mixed on one form:
 *
 * - The platform's invoice to a shop, for its plan and for payment processing.
 * - The shop's document to the buyer, for the goods: the shop sold them.
 * - A credit note, the only way to reduce something already issued.
 *
 * No e-invoice may be issued before BIR grants a Permit to Issue (PTI). Until
 * INVOICE_PTI_NUMBER is set, the platform's documents are billing statements
 * and say they are not invoices. Whether Maretinda's system may issue a shop's
 * sales invoice on its behalf is an open question for the RDO, so those stay
 * order summaries until SELLER_INVOICING_ENABLED=true. Both use their own
 * number series, so the official series starts clean. Amounts are pesos, VAT
 * inclusive.
 */

export { renderInvoicePdf } from "./invoice-pdf"

export const VAT_RATE = 0.12

export type InvoiceParty = {
  name: string
  trade_name?: string | null
  address?: string | null
  tin?: string | null
  vat_registered?: boolean
  email?: string | null
  phone?: string | null
  website?: string | null
  merchant_id?: string | null
}

export type InvoiceLine = { description: string; quantity: number; unit_price: number }

export type InvoiceKind = "order" | "subscription" | "fees" | "credit"
export type InvoiceDocument = "invoice" | "statement" | "summary" | "credit_note" | "adjustment"

export type InvoiceData = {
  kind: InvoiceKind
  document: InvoiceDocument
  official: boolean
  number: string
  unique_id: string
  issued_at: string
  reference: string
  issuer: InvoiceParty
  buyer: InvoiceParty
  lines: InvoiceLine[]
  shipping: number
  discount: number
  discount_note?: string | null
  terms?: string | null
  due_date?: string | null
  pti_number?: string | null
  settlement?: string | null
  bank_details?: string | null
  withholding_note?: string | null
  verify_url?: string | null
  delivered_to?: string | null
  /** On a credit note: the document it reduces, and why. */
  original?: { number: string; issued_at: string; reason: string } | null
}

export type InvoiceTotals = {
  gross: number
  discount: number
  total: number
  vatable_sales: number
  vat: number
  non_vat_sales: number
}

export const isCredit = (d: Pick<InvoiceData, "document">) => d.document === "credit_note" || d.document === "adjustment"

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Prices are VAT inclusive, so a VAT-registered issuer's total splits into net sales and 12% VAT. */
export function invoiceTotals(data: Pick<InvoiceData, "lines" | "shipping" | "discount" | "issuer">): InvoiceTotals {
  const items = data.lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)
  const gross = round2(items + (data.shipping || 0))
  const discount = round2(Math.min(data.discount || 0, gross))
  const total = round2(gross - discount)
  if (!data.issuer.vat_registered) {
    return { gross, discount, total, vatable_sales: 0, vat: 0, non_vat_sales: total }
  }
  const vatable_sales = round2(total / (1 + VAT_RATE))
  return { gross, discount, total, vatable_sales, vat: round2(total - vatable_sales), non_vat_sales: 0 }
}

const manilaYear = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric" }).format(d)
const manilaDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d)

/** MRT-2026-0000001. The serial keeps running across years; only the year in front changes. */
export const formatInvoiceNumber = (prefix: string, n: number, at = new Date()) =>
  `${prefix}-${manilaYear(at)}-${String(n).padStart(7, "0")}`

/** "767-899-470-00000": a TIN with its branch code, however it was typed. Anything else is left alone. */
export function formatTin(tin: string | null | undefined): string | null {
  const raw = (tin ?? "").trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  if (![9, 12, 14].includes(digits.length)) return raw
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9).padStart(5, "0")}`
}

type Env = Record<string, string | undefined>

/** BIR's Permit to Issue number, once it is granted. Nothing is an invoice before that. */
export const ptiNumber = (env: Env = process.env) => env.INVOICE_PTI_NUMBER?.trim() || null

export const sellerInvoicingEnabled = (env: Env = process.env) => env.SELLER_INVOICING_ENABLED === "true"

/** The operator's registered details, from its Certificate of Registration (BIR Form 2303). */
export function platformIssuer(env: Env = process.env): InvoiceParty {
  return {
    name: env.INVOICE_ISSUER_NAME || "BIMS TECHNOLOGIES INC.",
    trade_name: env.INVOICE_ISSUER_TRADE_NAME || "Maretinda",
    address: env.INVOICE_ISSUER_ADDRESS || "17F KMC Skyrise 4B, West Geonzon St., Cebu IT Park, Apas, 6000 Cebu City, Cebu",
    tin: formatTin(env.INVOICE_ISSUER_TIN || "767-899-470-00000"),
    vat_registered: env.INVOICE_ISSUER_VAT_REGISTERED ? env.INVOICE_ISSUER_VAT_REGISTERED === "true" : true,
    email: env.INVOICE_ISSUER_EMAIL || "support@maretinda.com",
    phone: env.INVOICE_ISSUER_PHONE || null,
    website: env.INVOICE_ISSUER_WEBSITE || "maretinda.com",
  }
}

const newUniqueId = () => `MRT${crypto.randomBytes(8).toString("hex").toUpperCase()}`

export const verifyUrl = (uniqueId: string) => `${storefrontUrl()}/verify-invoice/${uniqueId}`

/** Next number in an issuer's series. The row lock makes concurrent orders queue, so no gaps or repeats. */
export async function nextInvoiceNumber(trx: any, series: string, prefix: string, at = new Date()): Promise<string> {
  await trx.raw(`INSERT INTO invoice_series (issuer, last_number) VALUES (?, 0) ON CONFLICT (issuer) DO NOTHING`, [series])
  const result = await trx.raw(
    `UPDATE invoice_series SET last_number = last_number + 1 WHERE issuer = ? RETURNING last_number`,
    [series]
  )
  return formatInvoiceNumber(prefix, Number(result.rows[0].last_number), at)
}

/** Which series a document numbers itself in. Official and non-official never share one. */
function seriesOf(document: InvoiceDocument, sellerId?: string | null): { series: string; prefix: string } {
  const shop = sellerId ? sellerPrefix(sellerId) : ""
  switch (document) {
    case "invoice":
      return sellerId ? { series: `${sellerId}:invoice`, prefix: `S-${shop}` } : { series: "platform:invoice", prefix: "MRT" }
    case "credit_note":
      return sellerId ? { series: `${sellerId}:credit`, prefix: `CN-${shop}` } : { series: "platform:credit", prefix: "MRT-CN" }
    case "summary":
      return { series: `${sellerId}:summary`, prefix: `OS-${shop}` }
    case "adjustment":
      return sellerId ? { series: `${sellerId}:adjustment`, prefix: `OA-${shop}` } : { series: "platform:adjustment", prefix: "MRT-BA" }
    default:
      return { series: "platform:statement", prefix: "MRT-BS" }
  }
}

export type IssuedInvoice = {
  id: string
  number: string
  document: InvoiceDocument
  official: boolean
  file_name: string
  pdf: Buffer
  total: number
}

const FILE_NAMES: Record<InvoiceDocument, string> = {
  invoice: "Invoice",
  statement: "Billing-statement",
  summary: "Order-summary",
  credit_note: "Credit-note",
  adjustment: "Billing-adjustment",
}

export const invoiceFileName = (row: { document?: string | null; number: string }) =>
  `${FILE_NAMES[(row.document ?? "invoice") as InvoiceDocument] ?? "Invoice"}-${row.number}.pdf`

/** What to call the document in an email or on a screen. */
export const documentLabel = (document: InvoiceDocument) => FILE_NAMES[document].replace("-", " ").toLowerCase()

type IssueInput = {
  kind: InvoiceKind
  document: InvoiceDocument
  official: boolean
  reference_id: string
  /** The shop issuing it; null when the platform does. */
  issuer_seller_id?: string | null
  seller_id?: string | null
  customer_id?: string | null
  corrects_id?: string | null
  data: Omit<InvoiceData, "number" | "unique_id" | "issued_at" | "kind" | "document" | "official" | "verify_url">
}

const asIssued = (row: any): IssuedInvoice => ({
  id: row.id,
  number: row.number,
  document: row.document ?? "invoice",
  official: !!row.official,
  file_name: invoiceFileName(row),
  pdf: row.pdf,
  total: Number(row.total),
})

/** Issues a document once per order or period; a repeat call returns the one already issued. */
export async function issueInvoice(pg: any, input: IssueInput): Promise<IssuedInvoice> {
  const find = () => pg("invoice").where({ kind: input.kind, reference_id: input.reference_id }).first()
  const existing = await find()
  if (existing) return asIssued(existing)
  try {
    return await insertInvoice(pg, input)
  } catch (error: any) {
    // Two emails for one order race to issue it; the loser's number rolls back with its transaction
    if (error?.code !== "23505") throw error
    const winner = await find()
    if (!winner) throw error
    return asIssued(winner)
  }
}

function insertInvoice(pg: any, input: IssueInput): Promise<IssuedInvoice> {
  return pg.transaction(async (trx: any) => {
    const now = new Date()
    const { series, prefix } = seriesOf(input.document, input.issuer_seller_id)
    const number = await nextInvoiceNumber(trx, series, prefix, now)
    const unique_id = newUniqueId()
    const data: InvoiceData = {
      ...input.data,
      kind: input.kind,
      document: input.document,
      official: input.official,
      number,
      unique_id,
      issued_at: now.toISOString(),
      verify_url: verifyUrl(unique_id),
    }
    const pdf = await renderInvoicePdf(data)
    const row = {
      id: `inv_${crypto.randomBytes(12).toString("hex")}`,
      kind: input.kind,
      reference_id: input.reference_id,
      issuer: series,
      number,
      unique_id,
      document: input.document,
      official: input.official,
      corrects_id: input.corrects_id ?? null,
      seller_id: input.seller_id ?? null,
      customer_id: input.customer_id ?? null,
      total: invoiceTotals(data).total,
      data: JSON.stringify(data),
      pdf,
    }
    await trx("invoice").insert(row)
    return asIssued(row)
  })
}

const joinAddress = (parts: (string | null | undefined)[]) => parts.map((p) => (p || "").trim()).filter(Boolean).join(", ")

/** A short, stable part of a shop's number series, e.g. sel_01HXYZ...AB12CD -> AB12CD */
const sellerPrefix = (sellerId: string) => sellerId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()

/** MRT-M-00001: a shop's merchant number, given the first time a document needs it. */
export async function merchantId(pg: any, sellerId: string): Promise<string> {
  await pg("merchant_number").insert({ seller_id: sellerId }).onConflict("seller_id").ignore()
  const row = await pg("merchant_number").where("seller_id", sellerId).first("number")
  return `MRT-M-${String(row.number).padStart(5, "0")}`
}

/** The shop as a customer of the platform: its registered name and tax details, not its shop name. */
async function merchantParty(pg: any, seller: any): Promise<InvoiceParty> {
  const application = await pg("seller_application")
    .where("seller_id", seller.id)
    .whereNotNull("business_name")
    .orderBy("submitted_at", "desc")
    .first("business_name")
  return {
    name: application?.business_name || seller.name,
    address: joinAddress([seller.address_line, seller.city, seller.state, seller.postal_code]) || null,
    tin: formatTin(seller.tax_id),
    vat_registered: !!seller.vat_registered,
    email: seller.email,
    phone: seller.phone,
    merchant_id: await merchantId(pg, seller.id),
  }
}

/** Platform documents: an invoice under the PTI, a billing statement before it. */
const platformDocument = () => {
  const pti = ptiNumber()
  return { document: (pti ? "invoice" : "statement") as InvoiceDocument, official: !!pti, pti_number: pti }
}

/** The seller's invoice to the buyer for one order. Null when the order or its seller can't be found. */
export async function issueOrderInvoice(pg: any, orderId: string): Promise<IssuedInvoice | null> {
  const existing = await pg("invoice").where({ kind: "order", reference_id: orderId }).first()
  if (existing) return asIssued(existing)

  const order = await pg("order").where("id", orderId).first()
  if (!order) return null
  const link = await pg("seller_seller_order_order").where("order_id", orderId).whereNull("deleted_at").first("seller_id")
  const seller = link ? await pg("seller").where("id", link.seller_id).first() : null
  if (!seller) return null

  const items = await pg("order_item as oi")
    .join("order_line_item as li", "li.id", "oi.item_id")
    .where("oi.order_id", orderId)
    .whereNull("oi.deleted_at")
    .select("li.title", "li.variant_title", "li.unit_price", "oi.quantity", "li.id")
  const shippingRows = await pg("order_shipping as os")
    .join("order_shipping_method as sm", "sm.id", "os.shipping_method_id")
    .where("os.order_id", orderId)
    .whereNull("os.deleted_at")
    .select("sm.amount")
  const itemIds = items.map((i: any) => i.id)
  const adjustments = itemIds.length
    ? await pg("order_line_item_adjustment").whereIn("item_id", itemIds).whereNull("deleted_at").select("amount")
    : []
  const address = order.shipping_address_id ? await pg("order_address").where("id", order.shipping_address_id).first() : null
  const customer = order.customer_id ? await pg("customer").where("id", order.customer_id).first() : null
  const method = await paymentMethodOfOrder(pg, orderId)

  const buyerName =
    [address?.first_name, address?.last_name].filter(Boolean).join(" ") ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    order.email ||
    "Customer"

  const official = sellerInvoicingEnabled() && !!ptiNumber()
  return issueInvoice(pg, {
    kind: "order",
    document: official ? "invoice" : "summary",
    official,
    reference_id: orderId,
    issuer_seller_id: seller.id,
    seller_id: seller.id,
    customer_id: order.customer_id ?? null,
    data: {
      reference: `#${order.display_id ?? orderId}`,
      pti_number: official ? ptiNumber() : null,
      issuer: {
        name: seller.name,
        address: joinAddress([seller.address_line, seller.city, seller.state, seller.postal_code]),
        tin: formatTin(seller.tax_id),
        vat_registered: !!seller.vat_registered,
        email: seller.email,
        phone: seller.phone,
      },
      buyer: {
        name: buyerName,
        address: joinAddress([address?.address_1, address?.address_2, address?.city, address?.province, address?.postal_code]),
        email: order.email || customer?.email,
        phone: address?.phone,
      },
      lines: items.map((i: any) => ({
        description: [i.title, i.variant_title].filter(Boolean).join(" - "),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
      shipping: shippingRows.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0),
      discount: adjustments.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0),
      settlement: method,
      delivered_to: order.email || customer?.email,
    },
  })
}

async function paymentMethodOfOrder(pg: any, orderId: string): Promise<string | null> {
  try {
    const row = await pg("order_payment_collection as opc")
      .join("payment_session as ps", "ps.payment_collection_id", "opc.payment_collection_id")
      .where("opc.order_id", orderId)
      .orderBy("ps.created_at", "desc")
      .first("ps.provider_id")
    if (!row) return null
    return /giyapay/i.test(row.provider_id) ? "Online payment (GiyaPay)" : "Cash on Delivery"
  } catch {
    return null
  }
}

/** The platform's invoice to a seller for a paid subscription period. Trials and complimentary plans get none. */
export async function issueSubscriptionInvoice(pg: any, subscriptionId: string): Promise<IssuedInvoice | null> {
  const sub = await pg("seller_subscription").where("id", subscriptionId).first()
  if (!sub || sub.is_trial || !(Number(sub.price) > 0)) return null
  const seller = await pg("seller").where("id", sub.seller_id).first()
  if (!seller) return null

  const day = (d: any) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" })
  const { pti_number, ...doc } = platformDocument()
  return issueInvoice(pg, {
    kind: "subscription",
    ...doc,
    reference_id: sub.id,
    seller_id: seller.id,
    data: {
      reference: sub.payment_reference || sub.id,
      pti_number,
      terms: "Due on receipt",
      due_date: manilaDate(new Date()),
      issuer: platformIssuer(),
      buyer: await merchantParty(pg, seller),
      lines: [
        {
          description: `Maretinda ${sub.plan_name} plan, ${sub.billing_period === "yearly" ? "yearly" : "monthly"} subscription, ${day(sub.start_date)} to ${day(sub.end_date)}`,
          quantity: 1,
          unit_price: Number(sub.price),
        },
      ],
      shipping: 0,
      discount: 0,
      settlement: `Paid online through GiyaPay${sub.payment_reference ? `, reference ${sub.payment_reference}` : ""}`,
      withholding_note: process.env.INVOICE_WITHHOLDING_NOTE || null,
      delivered_to: seller.email,
    },
  })
}

const PROCESSING_RATE = 0.025

/**
 * The platform's document to a shop for what its payouts deducted in a month:
 * payment processing, and the flat payout fee. Null when nothing was deducted.
 * `month` is "2026-11", in Manila time.
 */
export async function issueFeesInvoice(pg: any, sellerId: string, month: string): Promise<IssuedInvoice | null> {
  const seller = await pg("seller").where("id", sellerId).first()
  if (!seller || !/^\d{4}-\d{2}$/.test(month)) return null
  const from = new Date(`${month}-01T00:00:00+08:00`)
  const to = new Date(from)
  to.setUTCMonth(to.getUTCMonth() + 1)
  const lines = await pg("settlement_line")
    .where("seller_id", sellerId)
    .whereNot("kind", "legacy")
    .where("created_at", ">=", from)
    .where("created_at", "<", to)
    .select("gross_amount", "net_amount")
  const deducted = round2(lines.reduce((sum: number, l: any) => sum + (Number(l.gross_amount) - Number(l.net_amount)), 0))
  if (!(deducted > 0)) return null
  const processing = round2(Math.min(deducted, lines.reduce((sum: number, l: any) => sum + round2(Number(l.gross_amount) * PROCESSING_RATE), 0)))
  const payoutFee = round2(deducted - processing)
  const period = from.toLocaleDateString("en-PH", { year: "numeric", month: "long", timeZone: "Asia/Manila" })

  const { pti_number, ...doc } = platformDocument()
  return issueInvoice(pg, {
    kind: "fees",
    ...doc,
    reference_id: `${sellerId}:${month}`,
    seller_id: sellerId,
    data: {
      reference: `Payouts ${month}`,
      pti_number,
      terms: "Deducted from payouts",
      issuer: platformIssuer(),
      buyer: await merchantParty(pg, seller),
      lines: [
        { description: `Payment processing fee, ${period}`, quantity: 1, unit_price: processing },
        ...(payoutFee > 0 ? [{ description: `Payout fee, ${period} (${lines.length} payment${lines.length === 1 ? "" : "s"})`, quantity: 1, unit_price: payoutFee }] : []),
      ],
      shipping: 0,
      discount: 0,
      settlement: `Deducted from merchant payouts in ${period}`,
      withholding_note: process.env.INVOICE_WITHHOLDING_NOTE || null,
      delivered_to: seller.email,
    },
  })
}

export type CreditInput = { amount: number; reason: string }

/** Checks a credit note request. Returns it cleaned, or the message to show. */
export function parseCredit(body: any): CreditInput | string {
  const amount = Math.round(Number(body?.amount) * 100) / 100
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : ""
  if (!Number.isFinite(amount) || amount <= 0) return "Enter how much to credit."
  if (!reason) return "Say why: return, allowance, discount or overbilling. It is printed on the credit note."
  return { amount, reason }
}

/** Reduces an issued platform document. The original stays as it was issued. */
export async function issueCreditNote(pg: any, invoiceId: string, input: CreditInput): Promise<IssuedInvoice | { error: string }> {
  return pg.transaction(async (trx: any) => {
    // Lock the original so two credits can't both fit in what is left of it
    const original = await trx("invoice").where("id", invoiceId).forUpdate().first()
    if (!original) return { error: "Document not found" }
    if (original.kind === "order") return { error: "A shop's order document is corrected by the shop, not by Maretinda." }
    if (original.kind === "credit") return { error: "A credit note can't be credited." }
    const before = await trx("invoice").where("corrects_id", original.id).sum("total as total").first()
    const left = round2(Number(original.total) - Number(before?.total ?? 0))
    if (input.amount > left) return { error: left > 0 ? `At most ₱${left.toFixed(2)} of this document is left to credit.` : "This document is already fully credited." }

    const data = typeof original.data === "string" ? JSON.parse(original.data) : original.data
    return insertInvoice(trx, {
      kind: "credit",
      document: original.official ? "credit_note" : "adjustment",
      official: !!original.official,
      reference_id: `${original.id}:${crypto.randomBytes(6).toString("hex")}`,
      corrects_id: original.id,
      seller_id: original.seller_id,
      data: {
        reference: data.reference,
        pti_number: original.official ? ptiNumber() : null,
        issuer: data.issuer,
        buyer: data.buyer,
        lines: [{ description: `Credit: ${(data.lines ?? []).map((l: InvoiceLine) => l.description).join("; ")}`.slice(0, 400), quantity: 1, unit_price: input.amount }],
        shipping: 0,
        discount: 0,
        original: { number: original.number, issued_at: new Date(original.issued_at).toISOString(), reason: input.reason },
        delivered_to: data.buyer?.email ?? null,
      },
    })
  })
}

/** What anyone with the QR code may see: that the document is real, and what it says in short. */
export async function verifyInvoice(pg: any, uniqueId: string) {
  if (!/^MRT[0-9A-F]{16}$/.test(uniqueId)) return null
  const row = await pg("invoice").where("unique_id", uniqueId).first("id", "number", "document", "official", "total", "issued_at", "data")
  if (!row) return null
  const credited = await pg("invoice").where("corrects_id", row.id).sum("total as total").first()
  const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data
  return {
    number: row.number,
    document: row.document ?? "invoice",
    official: !!row.official,
    issued_at: row.issued_at,
    issuer: data?.issuer?.name ?? null,
    issuer_tin: data?.issuer?.tin ?? null,
    total: Number(row.total),
    credited: Number(credited?.total ?? 0),
    corrects: data?.original?.number ?? null,
  }
}

/** The shape Medusa's notification module expects for an email attachment. */
export const invoiceAttachment = (invoice: IssuedInvoice) => ({
  filename: invoice.file_name,
  content: invoice.pdf.toString("base64"),
  content_type: "application/pdf",
  disposition: "attachment",
})

const LIST_FIELDS = ["id", "kind", "document", "official", "reference_id", "number", "unique_id", "corrects_id", "seller_id", "customer_id", "total", "issued_at"]

export async function listInvoices(pg: any, where: Record<string, unknown>, limit = 50, offset = 0, kinds?: string[]) {
  const base = pg("invoice").where(where)
  if (kinds?.length) base.whereIn("kind", kinds)
  const [invoices, count] = await Promise.all([
    base.clone().select(LIST_FIELDS).orderBy("issued_at", "desc").limit(Math.min(limit, 200)).offset(offset),
    base.clone().count("id as count").first(),
  ])
  return { invoices, count: Number(count?.count ?? 0) }
}

/** Sends a stored invoice as a PDF download. */
export function sendInvoicePdf(res: any, row: { number: string; document?: string | null; pdf: Buffer }) {
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${invoiceFileName(row)}"`)
  res.setHeader("Cache-Control", "private, no-store")
  res.status(200).send(row.pdf)
}
