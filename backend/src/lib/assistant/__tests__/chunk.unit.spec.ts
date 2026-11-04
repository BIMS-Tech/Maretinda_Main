import { createHash } from "crypto"
import { chunkMarkdown, loadKnowledgeChunks, makeDynamicChunk } from "../chunk"

const doc = `---
title: Returns and refunds
url: /help/returns
audience: buyer
---
Intro paragraph.

## Refund timelines
Refunds land in 5-7 days.

## Return window
You have 7 days to request a return.
`

describe("chunkMarkdown", () => {
  it("splits on ## headings and keeps the intro as its own chunk", () => {
    const chunks = chunkMarkdown("returns", doc)
    expect(chunks.map((c) => c.section)).toEqual([null, "Refund timelines", "Return window"])
  })

  it("prefixes each chunk with the document and section titles", () => {
    const [intro, refunds] = chunkMarkdown("returns", doc)
    expect(intro.content).toBe("Returns and refunds\n\nIntro paragraph.")
    expect(refunds.content).toBe("Returns and refunds — Refund timelines\n\nRefunds land in 5-7 days.")
  })

  it("gives each chunk a stable slug#index source and a content checksum", () => {
    const chunks = chunkMarkdown("returns", doc)
    expect(chunks.map((c) => c.source)).toEqual(["returns#0", "returns#1", "returns#2"])
    for (const c of chunks) {
      expect(c.checksum).toBe(createHash("sha256").update(c.content).digest("hex"))
    }
  })

  it("carries frontmatter url and audience onto every chunk", () => {
    for (const c of chunkMarkdown("returns", doc)) {
      expect(c).toMatchObject({ title: "Returns and refunds", url: "/help/returns", audience: "buyer" })
    }
  })

  it("reads a seller audience and treats anything else as buyer", () => {
    const seller = chunkMarkdown("s", "---\ntitle: T\naudience: seller\n---\nBody")
    const other = chunkMarkdown("o", "---\ntitle: T\naudience: admin\n---\nBody")
    expect(seller[0].audience).toBe("seller")
    expect(other[0].audience).toBe("buyer")
  })

  it("falls back to the slug as title when there is no frontmatter", () => {
    const [chunk] = chunkMarkdown("shipping-faq", "Just a body.")
    expect(chunk).toMatchObject({ title: "shipping-faq", url: null, audience: "buyer", section: null })
  })

  it("drops sections with no body", () => {
    const chunks = chunkMarkdown("x", "---\ntitle: T\n---\n## Empty\n\n## Filled\nText")
    expect(chunks.map((c) => c.section)).toEqual(["Filled"])
  })

  it("handles CRLF line endings", () => {
    const chunks = chunkMarkdown("x", "---\r\ntitle: T\r\n---\r\n## A\r\nOne\r\n## B\r\nTwo")
    expect(chunks.map((c) => c.section)).toEqual(["A", "B"])
  })

  it("only changes the checksum when content changes", () => {
    const a = chunkMarkdown("returns", doc)
    const b = chunkMarkdown("returns", doc.replace("5-7 days", "3-5 days"))
    expect(b[0].checksum).toBe(a[0].checksum)
    expect(b[1].checksum).not.toBe(a[1].checksum)
  })
})

describe("loadKnowledgeChunks", () => {
  it("loads the shipped knowledge base with unique sources and non-empty content", () => {
    const chunks = loadKnowledgeChunks()
    expect(chunks.length).toBeGreaterThan(0)
    expect(new Set(chunks.map((c) => c.source)).size).toBe(chunks.length)
    for (const c of chunks) {
      expect(c.content.trim().length).toBeGreaterThan(c.title.length)
      expect(["buyer", "seller"]).toContain(c.audience)
    }
  })
})

describe("makeDynamicChunk", () => {
  it("builds a single chunk with a title — section heading", () => {
    const chunk = makeDynamicChunk({
      slug: "plans",
      title: "Seller plans",
      section: "Pricing",
      url: "/sell/pricing",
      audience: "seller",
      body: "  Growth is ₱1,499/month.  ",
    })
    expect(chunk).toMatchObject({
      source: "plans#0",
      chunkIndex: 0,
      content: "Seller plans — Pricing\n\nGrowth is ₱1,499/month.",
      audience: "seller",
    })
  })
})
