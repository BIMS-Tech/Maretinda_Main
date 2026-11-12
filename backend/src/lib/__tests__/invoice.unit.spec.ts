import { formatInvoiceNumber, invoiceTotals, platformIssuer, renderInvoicePdf } from "../invoice"

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
  it("pads the serial", () => {
    expect(formatInvoiceNumber("MRT", 42)).toBe("MRT-00000042")
  })

  it("reads the operator's TIN and VAT status from the environment", () => {
    expect(platformIssuer({ INVOICE_ISSUER_TIN: "123-456-789-00000", INVOICE_ISSUER_VAT_REGISTERED: "true" })).toMatchObject({
      name: "BIMS Technologies, Inc.",
      tin: "123-456-789-00000",
      vat_registered: true,
    })
    expect(platformIssuer({}).vat_registered).toBe(false)
  })
})

describe("invoice PDF", () => {
  it("renders a PDF, across pages for a long order", async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ description: `Item ${i + 1} with a fairly long product name`, quantity: 1, unit_price: 10 }))
    const pdf = await renderInvoicePdf({
      kind: "order",
      number: "S-AB12CD-00000001",
      issued_at: "2026-11-13T02:00:00Z",
      reference: "#1042",
      issuer: { name: "QA Shop A", tin: null, vat_registered: false, address: "Cebu City" },
      buyer: { name: "Juan Dela Cruz", address: "Barangay Lahug, Cebu City" },
      lines: many,
      shipping: 85,
      discount: 0,
    })
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")
    expect(pdf.length).toBeGreaterThan(2000)
  })
})
