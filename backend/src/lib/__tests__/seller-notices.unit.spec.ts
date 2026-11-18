import { lowStockEmail } from "../low-stock"
import { reviewEmail, stars } from "../review-emails"

describe("new review email", () => {
  it("shows the rating as stars and quotes what the buyer wrote", () => {
    expect(stars(4)).toBe("★★★★☆")
    const e = reviewEmail({ reference: "product", rating: 4, note: "  Fits well ", productTitle: "Barong", sellerName: "Ana's" })
    expect(e.subject).toBe("New 4-star review of Barong")
    expect(e.paragraphs).toEqual(["A buyer rated “Barong” ★★★★☆ (4 of 5).", "They wrote: “Fits well”"])
  })

  it("nudges the shop to reply to a low shop rating", () => {
    const e = reviewEmail({ reference: "seller", rating: 1, note: null, sellerName: "Ana's" })
    expect(e.subject).toBe("New 1-star review of Ana's")
    expect(e.paragraphs.join(" ")).toMatch(/polite reply/)
  })
})

describe("low stock email", () => {
  const item = (over: Record<string, unknown>) => ({
    variant_id: "v",
    variant_title: "Default variant",
    sku: null,
    product_id: "p",
    product_title: "Tote bag",
    available: 3,
    seller_id: "s",
    seller_name: "Shop",
    seller_email: "shop@example.test",
    level: "low" as const,
    ...over,
  })

  it("names one item in the subject and leaves out a default variant name", () => {
    const e = lowStockEmail([item({})])
    expect(e.subject).toBe("Running low: Tote bag")
    expect(e.paragraphs[0]).toBe("Tote bag: 3 left")
  })

  it("counts several items and says when some ran out", () => {
    const e = lowStockEmail([item({ variant_title: "M", sku: "TB-M" }), item({ variant_title: "L", available: 0, level: "out" })])
    expect(e.subject).toBe("2 of your products are running low")
    expect(e.heading).toBe("Some of your stock has run out")
    expect(e.paragraphs.slice(0, 2)).toEqual(["Tote bag (M) · SKU TB-M: 3 left", "Tote bag (L): out of stock"])
  })
})
