import {
  formatInvoiceNumber,
  formatTin,
  invoiceTotals,
  parseCredit,
  platformIssuer,
  ptiNumber,
  renderInvoicePdf,
  sellerInvoicingEnabled,
} from "../invoice"

const lines = [
  { description: "Shirt - Large", quantity: 2, unit_price: 385 },
  { description: "Mug", quantity: 1, unit_price: 120 },
]

describe("invoice totals", () => {
  it("a non-VAT seller's total is all non-VAT sales", () => {
    const t = invoiceTotals({ lines, shipping: 120, discount: 77, issuer: { name: "Shop", vat_registered: false } })
    expect(t).toEqual({ gross: 1010, discount: 77, total: 933, vatable_sales: 0, vat: 0, non_vat_sales: 933 })
  })

  it("a VAT seller's inclusive total splits into net sales and 12% VAT that add back up", () => {
    const t = invoiceTotals({ lines: [{ description: "Plan", quantity: 1, unit_price: 1499 }], shipping: 0, discount: 0, issuer: { name: "BIMS", vat_registered: true } })
    expect(t.vatable_sales).toBe(1338.39)
    expect(t.vat).toBe(160.61)
    expect(t.vatable_sales + t.vat).toBeCloseTo(t.total, 2)
  })

  it("a discount can't push the total below zero", () => {
    expect(invoiceTotals({ lines: [{ description: "x", quantity: 1, unit_price: 50 }], shipping: 0, discount: 80, issuer: { name: "s" } }).total).toBe(0)
  })
})

describe("invoice numbering and issuer", () => {
  it("numbers MRT-YYYY-0000001 with the Manila year", () => {
    expect(formatInvoiceNumber("MRT", 42, new Date("2026-11-13T02:00:00Z"))).toBe("MRT-2026-0000042")
    // 1 January in Manila is still 31 December in UTC
    expect(formatInvoiceNumber("MRT", 43, new Date("2026-12-31T17:00:00Z"))).toBe("MRT-2027-0000043")
  })

  it("writes a TIN with its branch code, however it was typed", () => {
    expect(formatTin("767899470")).toBe("767-899-470-00000")
    expect(formatTin("767-899-470-001")).toBe("767-899-470-00001")
    expect(formatTin("767 899 470 00000")).toBe("767-899-470-00000")
    expect(formatTin("not a tin")).toBe("not a tin")
    expect(formatTin(" ")).toBeNull()
  })

  it("is the registered company from its COR, unless the environment says otherwise", () => {
    expect(platformIssuer({})).toMatchObject({ name: "BIMS TECHNOLOGIES INC.", tin: "767-899-470-00000", vat_registered: true })
    expect(platformIssuer({ INVOICE_ISSUER_TIN: "123456789", INVOICE_ISSUER_VAT_REGISTERED: "false" })).toMatchObject({
      tin: "123-456-789-00000",
      vat_registered: false,
    })
  })

  it("nothing is an invoice before the BIR permit", () => {
    expect(ptiNumber({})).toBeNull()
    expect(ptiNumber({ INVOICE_PTI_NUMBER: " PTI-081-2026-00001 " })).toBe("PTI-081-2026-00001")
    expect(sellerInvoicingEnabled({})).toBe(false)
  })
})

describe("credit notes", () => {
  it("need an amount and a reason", () => {
    expect(parseCredit({ amount: 0, reason: "x" })).toMatch(/how much/)
    expect(parseCredit({ amount: 10, reason: " " })).toMatch(/why/)
    expect(parseCredit({ amount: "99.999", reason: " Overbilling " })).toEqual({ amount: 100, reason: "Overbilling" })
  })
})

describe("invoice PDF", () => {
  const base = {
    kind: "order" as const,
    document: "summary" as const,
    official: false,
    number: "OS-AB12CD-2026-0000001",
    unique_id: "MRT0123456789ABCDEF",
    issued_at: "2026-11-13T02:00:00Z",
    reference: "#1042",
    issuer: { name: "QA Shop A", tin: null, vat_registered: false, address: "Cebu City" },
    buyer: { name: "Juan Dela Cruz", address: "Barangay Lahug, Cebu City" },
    lines,
    shipping: 85,
    discount: 0,
    verify_url: "https://maretinda.com/verify-invoice/MRT0123456789ABCDEF",
  }

  it("renders a PDF, across pages for a long order", async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ description: `Item ${i + 1} with a fairly long product name`, quantity: 1, unit_price: 10 }))
    const pdf = await renderInvoicePdf({ ...base, lines: many })
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(1)
  })

  it("fits an ordinary order on one page", async () => {
    const pdf = await renderInvoicePdf(base)
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)!.length).toBe(1)
  })
})
