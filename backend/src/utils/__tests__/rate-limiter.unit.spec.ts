import { checkRateLimit } from "../rate-limiter"

describe("checkRateLimit", () => {
  let now = 1_000_000
  let key = 0
  const id = () => `client-${++key}`

  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => now)
    // Skip the random 1% cleanup sweep so results are deterministic.
    jest.spyOn(Math, "random").mockReturnValue(0.5)
  })

  afterEach(() => jest.restoreAllMocks())

  it("allows up to maxRequests in a window and then blocks", () => {
    const client = id()
    const config = { maxRequests: 3, windowMs: 1000 }

    expect(checkRateLimit(client, config)).toEqual({ allowed: true, remaining: 2, resetIn: 1000 })
    expect(checkRateLimit(client, config)).toMatchObject({ allowed: true, remaining: 1 })
    expect(checkRateLimit(client, config)).toMatchObject({ allowed: true, remaining: 0 })
    expect(checkRateLimit(client, config)).toMatchObject({ allowed: false, remaining: 0 })
  })

  it("reports the time left in the window when blocked", () => {
    const client = id()
    const config = { maxRequests: 1, windowMs: 1000 }
    checkRateLimit(client, config)
    now += 400
    expect(checkRateLimit(client, config)).toEqual({ allowed: false, remaining: 0, resetIn: 600 })
  })

  it("opens a fresh window once the old one expires", () => {
    const client = id()
    const config = { maxRequests: 1, windowMs: 1000 }
    checkRateLimit(client, config)
    now += 1001
    expect(checkRateLimit(client, config)).toMatchObject({ allowed: true, remaining: 0 })
  })

  it("tracks clients independently", () => {
    const a = id()
    const b = id()
    const config = { maxRequests: 1, windowMs: 1000 }
    checkRateLimit(a, config)
    expect(checkRateLimit(a, config).allowed).toBe(false)
    expect(checkRateLimit(b, config).allowed).toBe(true)
  })

  it("defaults to 10 requests per minute", () => {
    const client = id()
    for (let i = 0; i < 10; i++) expect(checkRateLimit(client).allowed).toBe(true)
    expect(checkRateLimit(client)).toMatchObject({ allowed: false, resetIn: 60000 })
  })
})
