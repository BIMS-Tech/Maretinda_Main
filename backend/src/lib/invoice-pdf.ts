import PDFDocument from "pdfkit"
import { INVOICE_LOGO } from "./invoice-logo"
import { InvoiceData, InvoiceParty, invoiceTotals, isCredit } from "./invoice"
import { qrMatrix } from "./qr"

/**
 * The document as the e-invoice template lays it out: issuer and document
 * details, who it is sold to, numbered lines, the VAT breakdown, settlement,
 * and the verification QR. Standard PDF fonts have no peso sign, hence "PHP".
 */

const INK = "#1f1535"
const MUTED = "#5d5468"
const RULE = "#d9d4e6"
const BRAND = "#432c63"
const SOFT = "#f3f0fa"
const WARN = "#b3261e"

export const DOCUMENT_TITLES: Record<InvoiceData["document"], string> = {
  invoice: "INVOICE",
  statement: "BILLING STATEMENT",
  summary: "ORDER SUMMARY",
  credit_note: "CREDIT NOTE",
  adjustment: "BILLING ADJUSTMENT",
}

const money = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const manila = (iso: string) => {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso))
  const get = (type: string) => p.find((x) => x.type === type)?.value ?? ""
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour").replace("24", "00")}:${get("minute")} PHT` }
}

const vatStatus = (p: InvoiceParty) => (p.vat_registered === undefined ? null : p.vat_registered ? "VAT" : "Non-VAT")

export function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const totals = invoiceTotals(data)
  const platform = data.kind !== "order"
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    bufferPages: true,
    info: { Title: `${DOCUMENT_TITLES[data.document]} ${data.number}`, Author: data.issuer.name },
  })
  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })

  const left = 42
  const right = doc.page.width - 42
  const width = right - left
  const bottom = doc.page.height - 78

  const rule = (at: number, color = RULE, w = 0.7) => doc.moveTo(left, at).lineTo(right, at).strokeColor(color).lineWidth(w).stroke()

  // ── Issuer (left) ──
  let y = 40
  if (platform) {
    doc.roundedRect(left, y, 148, 32, 5).fill(BRAND)
    doc.image(INVOICE_LOGO, left + 12, y + 7, { width: 124 })
    y += 42
  }
  const issuerWidth = width * 0.54
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(platform ? 10.5 : 14)
  doc.text(platform && data.issuer.trade_name ? `${data.issuer.name} (${data.issuer.trade_name})` : data.issuer.name, left, y, { width: issuerWidth })
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
  const issuerLines = [
    data.issuer.address,
    data.issuer.tin
      ? `${data.issuer.vat_registered ? "VAT REG. TIN" : "NON-VAT REG. TIN"}: ${data.issuer.tin}`
      : `${data.issuer.vat_registered ? "VAT REG. TIN" : "NON-VAT REG. TIN"}: not provided`,
    data.issuer.tin ? branchLine(data.issuer.tin) : null,
    [data.issuer.phone, data.issuer.email, data.issuer.website].filter(Boolean).join("  |  ") || null,
    data.pti_number ? `PTI Electronic Invoice No.: ${data.pti_number}` : null,
  ]
  for (const line of issuerLines) if (line) doc.text(line, { width: issuerWidth })
  const issuerBottom = doc.y

  // ── Document details (right) ──
  const colX = left + width * 0.6
  const colW = width * 0.4
  doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(data.document === "invoice" || data.document === "credit_note" ? 22 : 16)
  doc.text(DOCUMENT_TITLES[data.document], colX, 42, { width: colW, align: "right" })
  const issued = manila(data.issued_at)
  let dy = doc.y + 6
  const detail = (label: string, value: string | null | undefined) => {
    if (!value) return
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(label, colX, dy, { width: 62 })
    doc.font("Helvetica-Bold").fillColor(INK).text(value, colX + 62, dy, { width: colW - 62, align: "right" })
    dy = Math.max(doc.y, dy + 11) + 2
  }
  detail("No.", data.number)
  detail("Date", `${issued.date} ${issued.time}`)
  detail("Terms", data.terms)
  detail("Due date", data.due_date)
  detail("Currency", "PHP")
  detail(platform ? "Order/Ref" : "Order", data.reference)
  detail("Unique ID", data.unique_id)
  if (data.original) {
    detail("Corrects", data.original.number)
    detail("Dated", manila(data.original.issued_at).date)
  }

  y = Math.max(issuerBottom, dy) + 10
  if (!data.official) {
    const notice =
      data.document === "summary"
        ? "THIS IS NOT AN INVOICE OR OFFICIAL RECEIPT. Ask the seller for the BIR-registered invoice of this sale. NOT VALID FOR CLAIM OF INPUT TAX."
        : "THIS IS NOT AN INVOICE. It records what was billed and paid. NOT VALID FOR CLAIM OF INPUT TAX."
    doc.font("Helvetica-Bold").fontSize(8)
    const h = doc.heightOfString(notice, { width: width - 20 }) + 12
    doc.roundedRect(left, y, width, h, 4).lineWidth(0.8).strokeColor(WARN).stroke()
    doc.fillColor(WARN).text(notice, left + 10, y + 6, { width: width - 20 })
    y += h + 10
  }
  rule(y)
  y += 8

  // ── Sold to ──
  doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(8).text(platform ? "SOLD TO (MERCHANT)" : "SOLD TO", left, y)
  y += 13
  const pair = (label: string, value: string | null | undefined, x: number, w: number, at: number) => {
    if (!value) return at
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(label, x, at, { width: 88 })
    doc.font("Helvetica-Bold").fillColor(INK).text(value, x + 90, at, { width: w - 90 })
    return Math.max(doc.y, at + 11) + 2
  }
  const half = width / 2 - 8
  const b = data.buyer
  y = pair(platform ? "Registered name" : "Name", b.name || "Customer", left, width, y)
  y = pair(platform ? "Business address" : "Address", b.address, left, width, y)
  const afterLeft = pair("TIN / branch code", platform ? b.tin || "not provided" : b.tin, left, half, y)
  const afterRight = pair("Status", platform ? vatStatus(b) : null, left + width / 2 + 8, half, y)
  y = Math.max(afterLeft, afterRight)
  const merchant = pair("Merchant ID", b.merchant_id, left, half, y)
  const email = pair("Email", b.email, b.merchant_id ? left + width / 2 + 8 : left, half, y)
  y = Math.max(merchant, email)
  if (!platform) y = pair("Phone", b.phone, left, half, y)
  if (data.original?.reason) y = pair("Reason", data.original.reason, left, width, y)
  y += 6

  // ── Lines ──
  const col = { no: left, desc: left + 26, qty: left + width * 0.58, unit: left + width * 0.67, amt: left + width * 0.83 }
  const header = (at: number) => {
    doc.rect(left, at, width, 19).fill(SOFT)
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8)
    doc.text("No.", col.no + 5, at + 6, { width: 22 })
    doc.text(platform ? "Description (nature of service)" : "Description", col.desc, at + 6)
    doc.text("Qty", col.qty, at + 6, { width: width * 0.07, align: "right" })
    doc.text("Unit cost", col.unit, at + 6, { width: width * 0.14, align: "right" })
    doc.text("Amount", col.amt, at + 6, { width: width * 0.17 - 6, align: "right" })
    return at + 25
  }
  y = header(y)
  const rows = [...data.lines]
  if (data.shipping > 0) rows.push({ description: "Delivery fee", quantity: 1, unit_price: data.shipping })
  rows.forEach((line, i) => {
    doc.font("Helvetica").fontSize(9)
    const h = Math.max(doc.heightOfString(line.description, { width: width * 0.5 }), 11) + 8
    if (y + h > bottom) {
      doc.addPage()
      y = header(42)
      doc.font("Helvetica").fontSize(9)
    }
    doc.fillColor(MUTED).text(String(i + 1), col.no + 5, y, { width: 22 })
    doc.fillColor(INK).text(line.description, col.desc, y, { width: width * 0.5 })
    doc.text(String(line.quantity), col.qty, y, { width: width * 0.07, align: "right" })
    doc.text(money(line.unit_price), col.unit, y, { width: width * 0.14, align: "right" })
    doc.text(money(line.quantity * line.unit_price), col.amt, y, { width: width * 0.17 - 6, align: "right" })
    y += h
    rule(y - 4, RULE, 0.5)
  })

  // ── Totals, settlement and QR stay together ──
  if (y + 235 > bottom + 30) {
    doc.addPage()
    y = 42
  }
  y += 6
  const labelX = left + width * 0.52
  const valueX = labelX + width * 0.26
  const row = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9).fillColor(bold ? INK : MUTED)
    doc.text(label, labelX, y, { width: width * 0.28 })
    doc.fillColor(INK).text(value, valueX, y, { width: width * 0.22 - 6, align: "right" })
    y += bold ? 18 : 14
  }
  if (totals.discount > 0) row(`Less: Discount${data.discount_note ? ` (${data.discount_note})` : ""}`, money(totals.discount))
  if (data.issuer.vat_registered) {
    row("VATable sales", money(totals.vatable_sales))
    row("VAT-exempt sales", money(0))
    row("Zero-rated sales", money(0))
    row("Add: VAT 12%", money(totals.vat))
  }
  doc.moveTo(labelX, y + 1).lineTo(right, y + 1).strokeColor(INK).lineWidth(1).stroke()
  y += 7
  row(isCredit(data) ? "TOTAL CREDITED  PHP" : data.kind === "order" ? "TOTAL  PHP" : "TOTAL AMOUNT DUE  PHP", money(totals.total), true)

  y += 4
  rule(y)
  y += 8
  const note = (label: string, value: string | null | undefined) => {
    if (!value) return
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(`${label}: `, left, y, { width, continued: true })
    doc.font("Helvetica").fillColor(MUTED).text(value)
    y = doc.y + 2
  }
  note("Settlement", data.settlement)
  note("Bank details", data.bank_details)
  note("Withholding", data.withholding_note)
  if (!data.issuer.vat_registered && data.official) note("Note", "THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX.")
  y += 4

  if (data.verify_url) {
    const at = y
    const qrSize = 74
    try {
      const qr = qrMatrix(data.verify_url)
      const cell = qrSize / qr.length
      doc.fillColor("#000000")
      qr.forEach((line, r) => line.forEach((dark, c) => dark && doc.rect(left + c * cell, at + r * cell, cell + 0.05, cell + 0.05)))
      doc.fill()
    } catch {
      // Too long for a code: the link itself is printed beside it
    }
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
    doc.text("Scan to check this document, or open:", left + qrSize + 14, at + 8, { width: width - qrSize - 14 })
    doc.fillColor(BRAND).text(data.verify_url, { width: width - qrSize - 14 })
    if (data.delivered_to) {
      doc.fillColor(MUTED).text(`Delivered to: ${data.delivered_to} on ${issued.date}`, { width: width - qrSize - 14 })
    }
  } else if (data.delivered_to) {
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`Delivered to: ${data.delivered_to} on ${issued.date}`, left, y)
  }

  // ── Footer on every page ──
  const pages = doc.bufferedPageRange().count
  for (let i = 0; i < pages; i++) {
    doc.switchToPage(i)
    doc.page.margins.bottom = 0
    const at = doc.page.height - 58
    rule(at)
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED)
    doc.text(
      data.official
        ? "This is an electronic invoice issued through the Maretinda invoicing system. A printed copy is for reference and record-keeping only."
        : platform
          ? "Issued through Maretinda (maretinda.com), operated by BIMS Technologies Inc."
          : `${data.issuer.name} sold these items through Maretinda (maretinda.com), operated by BIMS Technologies Inc.`,
      left,
      at + 7,
      { width: width - 70 }
    )
    doc.text(`Page ${i + 1} of ${pages}`, right - 70, at + 7, { width: 70, align: "right" })
  }

  doc.end()
  return done
}

/** "Branch code: 00000 (Head Office)", from the TIN's last five digits. */
function branchLine(tin: string): string | null {
  const digits = tin.replace(/\D/g, "")
  if (digits.length < 12) return null
  const branch = digits.slice(9).padStart(5, "0")
  return `Branch code: ${branch}${/^0+$/.test(branch) ? " (Head Office)" : ""}`
}
