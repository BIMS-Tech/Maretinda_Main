import crypto from "crypto"
import PDFDocument from "pdfkit"

/**
 * Invoices laid out to the BIR's content rules for a sales/service invoice
 * (Tax Code sec. 237 as amended by the Ease of Paying Taxes Act, RR 7-2024):
 * the issuer's registered name, address and TIN with its VAT status, a serial
 * number, the date, the buyer, each item with quantity, unit price and amount,
 * and the VAT breakdown, or the "not valid for claim of input tax" line when
 * the issuer isn't VAT registered.
 *
 * An order's invoice is the seller's: they sold the goods. A subscription
 * invoice is the platform operator's. Amounts are pesos, VAT inclusive.
 */

export const VAT_RATE = 0.12

export type InvoiceParty = {
  name: string
  trade_name?: string | null
  address?: string | null
  tin?: string | null
  vat_registered?: boolean
  email?: string | null
  phone?: string | null
}

export type InvoiceLine = { description: string; quantity: number; unit_price: number }

export type InvoiceData = {
  kind: "order" | "subscription"
  number: string
  issued_at: string
  reference: string
  issuer: InvoiceParty
  buyer: InvoiceParty
  lines: InvoiceLine[]
  shipping: number
  discount: number
  payment_method?: string | null
  /** BIR permit / acknowledgement text printed in the footer once the system is registered */
  permit?: string | null
}

export type InvoiceTotals = {
  gross: number
  discount: number
  total: number
  vatable_sales: number
  vat: number
  non_vat_sales: number
}

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

export const formatInvoiceNumber = (prefix: string, n: number) => `${prefix}-${String(n).padStart(8, "0")}`

/** The platform operator's registered details. The TIN and VAT status come from the environment. */
export function platformIssuer(env: Record<string, string | undefined> = process.env): InvoiceParty {
  return {
    name: env.INVOICE_ISSUER_NAME || "BIMS Technologies, Inc.",
    trade_name: env.INVOICE_ISSUER_TRADE_NAME || "Maretinda",
    address: env.INVOICE_ISSUER_ADDRESS || "KMC Skyrise 4A & 4B, Cebu IT Park, Cebu City, Philippines",
    tin: env.INVOICE_ISSUER_TIN || null,
    vat_registered: env.INVOICE_ISSUER_VAT_REGISTERED === "true",
    email: env.INVOICE_ISSUER_EMAIL || "support@maretinda.com",
  }
}

const peso = (n: number) =>
  `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const INK = "#1f1535"
const MUTED = "#6b6480"
const RULE = "#d9d4e6"
const BRAND = "#3b1f6e"

export function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const totals = invoiceTotals(data)
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Invoice ${data.number}` } })
  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })

  const left = 48
  const right = doc.page.width - 48
  const width = right - left
  const tinLine = (p: InvoiceParty) =>
    `${p.vat_registered ? "VAT Reg. TIN" : "Non-VAT Reg. TIN"}: ${p.tin || "not provided"}`

  // Issuer
  doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(15).text(data.issuer.name, left, 48, { width: width * 0.6 })
  doc.fillColor(MUTED).font("Helvetica").fontSize(9)
  if (data.issuer.trade_name && data.issuer.trade_name !== data.issuer.name) doc.text(data.issuer.trade_name, { width: width * 0.6 })
  if (data.issuer.address) doc.text(data.issuer.address, { width: width * 0.6 })
  doc.text(tinLine(data.issuer), { width: width * 0.6 })
  const contact = [data.issuer.email, data.issuer.phone].filter(Boolean).join("  |  ")
  if (contact) doc.text(contact, { width: width * 0.6 })
  const issuerBottom = doc.y

  // Title block
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(data.kind === "order" ? "SALES INVOICE" : "SERVICE INVOICE", left, 48, { width, align: "right" })
  doc.font("Helvetica").fontSize(9).fillColor(MUTED)
  doc.text(`No. ${data.number}`, { width, align: "right" })
  doc.text(`Date: ${new Date(data.issued_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })}`, { width, align: "right" })
  doc.text(`${data.kind === "order" ? "Order" : "Subscription"}: ${data.reference}`, { width, align: "right" })
  if (data.payment_method) doc.text(`Payment: ${data.payment_method}`, { width, align: "right" })

  let y = Math.max(issuerBottom, doc.y) + 18
  doc.moveTo(left, y).lineTo(right, y).strokeColor(RULE).stroke()
  y += 12

  // Buyer
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("SOLD TO", left, y)
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(data.buyer.name || "Customer", left, y + 12, { width: width * 0.7 })
  doc.font("Helvetica").fontSize(9).fillColor(MUTED)
  if (data.buyer.address) doc.text(data.buyer.address, { width: width * 0.7 })
  doc.text(`TIN: ${data.buyer.tin || "not provided"}`, { width: width * 0.7 })
  const buyerContact = [data.buyer.email, data.buyer.phone].filter(Boolean).join("  |  ")
  if (buyerContact) doc.text(buyerContact, { width: width * 0.7 })
  y = doc.y + 16

  // Lines
  const col = { desc: left, qty: left + width * 0.56, unit: left + width * 0.66, amt: left + width * 0.83 }
  const header = (at: number) => {
    doc.rect(left, at, width, 20).fill("#f3f0fa")
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8)
    doc.text("DESCRIPTION", col.desc + 6, at + 6)
    doc.text("QTY", col.qty, at + 6, { width: width * 0.08, align: "right" })
    doc.text("UNIT PRICE", col.unit, at + 6, { width: width * 0.16, align: "right" })
    doc.text("AMOUNT", col.amt, at + 6, { width: width * 0.17 - 6, align: "right" })
    return at + 26
  }
  y = header(y)
  const rows = [...data.lines]
  if (data.shipping > 0) rows.push({ description: "Shipping and handling", quantity: 1, unit_price: data.shipping })
  doc.font("Helvetica").fontSize(9)
  for (const line of rows) {
    const h = Math.max(doc.heightOfString(line.description, { width: width * 0.54 }), 11) + 8
    if (y + h > doc.page.height - 190) {
      doc.addPage()
      y = header(48)
      doc.font("Helvetica").fontSize(9)
    }
    doc.fillColor(INK).text(line.description, col.desc + 6, y, { width: width * 0.54 })
    doc.text(String(line.quantity), col.qty, y, { width: width * 0.08, align: "right" })
    doc.text(peso(line.unit_price), col.unit, y, { width: width * 0.16, align: "right" })
    doc.text(peso(round2(line.quantity * line.unit_price)), col.amt, y, { width: width * 0.17 - 6, align: "right" })
    y += h
    doc.moveTo(left, y - 4).lineTo(right, y - 4).strokeColor(RULE).lineWidth(0.5).stroke()
  }

  // Totals
  y += 8
  const labelX = left + width * 0.5
  const row = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9).fillColor(bold ? INK : MUTED)
    doc.text(label, labelX, y, { width: width * 0.28 })
    doc.fillColor(INK).text(value, labelX + width * 0.28, y, { width: width * 0.22 - 6, align: "right" })
    y += bold ? 18 : 14
  }
  row("Total sales", peso(totals.gross))
  if (totals.discount > 0) row("Less: discount", `- ${peso(totals.discount)}`)
  if (data.issuer.vat_registered) {
    row("VATable sales", peso(totals.vatable_sales))
    row("VAT (12%)", peso(totals.vat))
    row("VAT-exempt sales", peso(0))
    row("Zero-rated sales", peso(0))
  }
  doc.moveTo(labelX, y + 2).lineTo(right, y + 2).strokeColor(INK).lineWidth(1).stroke()
  y += 8
  row("TOTAL AMOUNT DUE", peso(totals.total), true)

  // Footer
  const footerY = doc.page.height - 120
  doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(RULE).lineWidth(0.5).stroke()
  doc.font("Helvetica-Bold").fontSize(8).fillColor(INK)
  if (!data.issuer.vat_registered) {
    doc.text("THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX.", left, footerY + 10, { width })
  } else {
    doc.text("Prices are inclusive of 12% VAT.", left, footerY + 10, { width })
  }
  doc.font("Helvetica").fontSize(8).fillColor(MUTED)
  if (data.permit) doc.text(data.permit, { width })
  doc.text(
    data.kind === "order"
      ? `Issued by ${data.issuer.name} for a sale made through Maretinda (maretinda.com), operated by BIMS Technologies, Inc.`
      : "Maretinda is operated by BIMS Technologies, Inc.",
    { width }
  )
  doc.text("System-generated document. No signature required.", { width })

  doc.end()
  return done
}

/** Next number in an issuer's series. The row lock makes concurrent orders queue, so no gaps or repeats. */
export async function nextInvoiceNumber(trx: any, issuer: string, prefix: string): Promise<string> {
  await trx.raw(`INSERT INTO invoice_series (issuer, last_number) VALUES (?, 0) ON CONFLICT (issuer) DO NOTHING`, [issuer])
  const result = await trx.raw(
    `UPDATE invoice_series SET last_number = last_number + 1 WHERE issuer = ? RETURNING last_number`,
    [issuer]
  )
  return formatInvoiceNumber(prefix, Number(result.rows[0].last_number))
}

export type IssuedInvoice = { id: string; number: string; file_name: string; pdf: Buffer; total: number }

const fileName = (number: string) => `Invoice-${number}.pdf`

type IssueInput = {
  kind: InvoiceData["kind"]
  reference_id: string
  issuer_key: string
  prefix: string
  seller_id?: string | null
  customer_id?: string | null
  data: Omit<InvoiceData, "number" | "issued_at" | "kind">
}

/** Issues an invoice once per order or subscription; a repeat call returns the one already issued. */
export async function issueInvoice(pg: any, input: IssueInput): Promise<IssuedInvoice> {
  const existing = await pg("invoice").where({ kind: input.kind, reference_id: input.reference_id }).first()
  if (existing) return { id: existing.id, number: existing.number, file_name: fileName(existing.number), pdf: existing.pdf, total: Number(existing.total) }

  try {
    return await insertInvoice(pg, input)
  } catch (error: any) {
    // Two emails for one order race to issue it; the loser's number rolls back with its transaction
    if (error?.code !== "23505") throw error
    const winner = await pg("invoice").where({ kind: input.kind, reference_id: input.reference_id }).first()
    if (!winner) throw error
    return { id: winner.id, number: winner.number, file_name: fileName(winner.number), pdf: winner.pdf, total: Number(winner.total) }
  }
}

function insertInvoice(pg: any, input: IssueInput): Promise<IssuedInvoice> {
  return pg.transaction(async (trx: any) => {
    const number = await nextInvoiceNumber(trx, input.issuer_key, input.prefix)
    const data: InvoiceData = { ...input.data, kind: input.kind, number, issued_at: new Date().toISOString() }
    const pdf = await renderInvoicePdf(data)
    const id = `inv_${crypto.randomBytes(12).toString("hex")}`
    const total = invoiceTotals(data).total
    await trx("invoice").insert({
      id,
      kind: input.kind,
      reference_id: input.reference_id,
      issuer: input.issuer_key,
      number,
      seller_id: input.seller_id ?? null,
      customer_id: input.customer_id ?? null,
      total,
      data: JSON.stringify(data),
      pdf,
    })
    return { id, number, file_name: fileName(number), pdf, total }
  })
}

const joinAddress = (parts: (string | null | undefined)[]) => parts.map((p) => (p || "").trim()).filter(Boolean).join(", ")

const permitText = () => process.env.INVOICE_BIR_PERMIT_TEXT || null

/** A short, stable series prefix per shop, e.g. seller_01HXYZ...AB12 -> S-AB12CD */
const sellerPrefix = (sellerId: string) => `S-${sellerId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`

/** The seller's invoice to the buyer for one order. Null when the order or its seller can't be found. */
export async function issueOrderInvoice(pg: any, orderId: string): Promise<IssuedInvoice | null> {
  const existing = await pg("invoice").where({ kind: "order", reference_id: orderId }).first()
  if (existing) return { id: existing.id, number: existing.number, file_name: fileName(existing.number), pdf: existing.pdf, total: Number(existing.total) }

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

  return issueInvoice(pg, {
    kind: "order",
    reference_id: orderId,
    issuer_key: seller.id,
    prefix: sellerPrefix(seller.id),
    seller_id: seller.id,
    customer_id: order.customer_id ?? null,
    data: {
      reference: `#${order.display_id ?? orderId}`,
      issuer: {
        name: seller.name,
        address: joinAddress([seller.address_line, seller.city, seller.state, seller.postal_code]),
        tin: seller.tax_id,
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
      payment_method: method,
      permit: permitText(),
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
  return issueInvoice(pg, {
    kind: "subscription",
    reference_id: sub.id,
    issuer_key: "platform",
    prefix: "MRT",
    seller_id: seller.id,
    data: {
      reference: sub.payment_reference || sub.id,
      issuer: platformIssuer(),
      buyer: {
        name: seller.name,
        address: joinAddress([seller.address_line, seller.city, seller.state, seller.postal_code]),
        tin: seller.tax_id,
        email: seller.email,
        phone: seller.phone,
      },
      lines: [
        {
          description: `Maretinda ${sub.plan_name} plan, ${sub.billing_period === "yearly" ? "yearly" : "monthly"} subscription (${day(sub.start_date)} to ${day(sub.end_date)})`,
          quantity: 1,
          unit_price: Number(sub.price),
        },
      ],
      shipping: 0,
      discount: 0,
      payment_method: "Online payment (GiyaPay)",
      permit: permitText(),
    },
  })
}

/** The shape Medusa's notification module expects for an email attachment. */
export const invoiceAttachment = (invoice: IssuedInvoice) => ({
  filename: invoice.file_name,
  content: invoice.pdf.toString("base64"),
  content_type: "application/pdf",
  disposition: "attachment",
})

const LIST_FIELDS = ["id", "kind", "reference_id", "number", "seller_id", "customer_id", "total", "issued_at"]

export async function listInvoices(pg: any, where: Record<string, unknown>, limit = 50, offset = 0) {
  const base = pg("invoice").where(where)
  const [invoices, count] = await Promise.all([
    base.clone().select(LIST_FIELDS).orderBy("issued_at", "desc").limit(Math.min(limit, 200)).offset(offset),
    base.clone().count("id as count").first(),
  ])
  return { invoices, count: Number(count?.count ?? 0) }
}

/** Sends a stored invoice as a PDF download. */
export function sendInvoicePdf(res: any, row: { number: string; pdf: Buffer }) {
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="Invoice-${row.number}.pdf"`)
  res.setHeader("Cache-Control", "private, no-store")
  res.status(200).send(row.pdf)
}
