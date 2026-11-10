import { flyingTigersErrorMessage, getFlyingTigersRates } from "../flyingtigers"

describe("flyingTigersErrorMessage", () => {
  it("passes on Flying Tigers' own explanation, not its JSON", () => {
    const body = {
      error: "Bad Request",
      message: "Address must include provinceCode or a resolvable provinceLabel.",
      path: "/api/shipments",
      statusCode: 400,
    }
    expect(flyingTigersErrorMessage("create order", 400, body)).toBe(
      "Flying Tigers couldn't create order: Address must include provinceCode or a resolvable provinceLabel."
    )
  })

  it("joins a list of validation messages", () => {
    expect(flyingTigersErrorMessage("create order", 400, { message: ["weight must be positive", "phone is invalid"] })).toBe(
      "Flying Tigers couldn't create order: weight must be positive; phone is invalid"
    )
  })

  it("falls back to the status when there's no message", () => {
    expect(flyingTigersErrorMessage("cancel order", 502, {})).toBe("Flying Tigers couldn't cancel order (HTTP 502)")
  })
})

describe("a refused request", () => {
  afterEach(() => jest.restoreAllMocks())

  it("keeps Flying Tigers' HTTP status, so wrong keys can be told apart", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid API key or secret" }), { status: 401 })
    )
    await expect(getFlyingTigersRates("k", "s", { origin_postal: "1000", dest_postal: "1600", weight_kg: 1 })).rejects.toMatchObject({
      status: 401,
      message: "Flying Tigers couldn't get rates: Invalid API key or secret",
    })
  })
})
