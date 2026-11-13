import { parseReport } from "../listing-reports"
import { returnEmails } from "../return-emails"

const good = { kind: "product", target: "prod_1", reason: "Scam or fraud", comment: "The seller asked me to pay outside the site." }

describe("a buyer's report", () => {
  it("is accepted with a known reason and enough detail", () => {
    expect(parseReport({ ...good, email: " Buyer@Example.com " })).toEqual({ ...good, email: "buyer@example.com" })
  })

  it("needs no email", () => {
    expect(parseReport(good)).toMatchObject({ email: null })
  })

  it.each([
    [{ ...good, kind: "order" }, "Choose what you are reporting"],
    [{ ...good, target: "" }, "We could not tell which listing this is about"],
    [{ ...good, reason: "I just don't like it" }, "Choose a reason"],
    [{ ...good, comment: "bad" }, "Tell us a little more about the problem (at least 10 characters)"],
    [{ ...good, comment: "x".repeat(2001) }, "Keep the details under 2,000 characters"],
    [{ ...good, email: "not-an-email" }, "Enter a valid email address"],
    [null, "Choose what you are reporting"],
  ])("is refused when wrong: %#", (body, message) => {
    expect(parseReport(body)).toBe(message)
  })
})

describe("return request emails", () => {
  const facts = { orderNumber: "1042", sellerName: "QA Shop A" }
  const to = (status: string, extra = {}) => returnEmails({ status, ...facts, ...extra }).map((e) => e.to)

  it("a new request tells the seller and confirms to the buyer", () => {
    expect(to("pending")).toEqual(["seller", "buyer"])
  })

  it("a seller's own decisions go to the buyer only", () => {
    expect(to("refunded", { sellerNote: "ok" })).toEqual(["buyer"])
    expect(to("withdrawn", { sellerNote: "worn" })).toEqual(["buyer"])
    expect(to("escalated", { sellerNote: "unsure" })).toEqual(["buyer"])
  })

  it("Maretinda's decisions on an escalated return go to both", () => {
    expect(to("refunded", { adminNote: "valid" })).toEqual(["buyer", "seller"])
    expect(to("canceled", { adminNote: "past the window" })).toEqual(["buyer", "seller"])
  })

  it("carries the reason and never promises an automatic refund", () => {
    const [declined] = returnEmails({ status: "withdrawn", ...facts, sellerNote: "Item was used" })
    expect(declined.paragraphs).toContain("Reason: Item was used")
    const [approved] = returnEmails({ status: "refunded", ...facts })
    expect(approved.paragraphs.join(" ")).toMatch(/support will contact you/)
    expect(approved.paragraphs.join(" ")).not.toMatch(/has been refunded|refunded to your/)
  })

  it("an unknown status sends nothing", () => {
    expect(returnEmails({ status: "whatever", ...facts })).toEqual([])
  })
})

describe("captcha", () => {
  const { requireCaptcha, verifyCaptcha } = require("../captcha")
  const answer = (ok: boolean, body: any) => (async () => ({ ok, json: async () => body })) as any

  it("reads Cloudflare's verdict, and tells an outage from a failure", async () => {
    expect(await verifyCaptcha("t", "s", "1.2.3.4", answer(true, { success: true }))).toBe("passed")
    expect(await verifyCaptcha("t", "s", "1.2.3.4", answer(true, { success: false }))).toBe("failed")
    expect(await verifyCaptcha("t", "s", undefined, answer(false, {}))).toBe("unavailable")
    expect(await verifyCaptcha("t", "s", undefined, (async () => { throw new Error("down") }) as any)).toBe("unavailable")
  })

  const run = async (req: any) => {
    const res: any = { status: jest.fn(() => res), json: jest.fn() }
    const next = jest.fn()
    await requireCaptcha({ method: "POST", headers: {}, body: {}, ...req }, res, next)
    return { res, next }
  }

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY
  })

  it("is off until a secret is set", async () => {
    expect((await run({})).next).toHaveBeenCalled()
  })

  it("refuses a sign-up with no token once it is on", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret"
    const { res, next } = await run({})
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0][0].code).toBe("captcha_required")
  })
})
