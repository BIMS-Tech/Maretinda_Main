import { sign } from "jsonwebtoken"
import { getOptionalCustomerId } from "../optional-customer"

const SECRET = "unit-test-secret"

const req = (headers: Record<string, string> = {}, auth_context?: any) =>
  ({ headers, auth_context }) as any

const bearer = (payload: object, secret = SECRET, opts: object = {}) => ({
  authorization: `Bearer ${sign(payload, secret, opts)}`,
})

describe("getOptionalCustomerId", () => {
  const original = process.env.JWT_SECRET
  beforeAll(() => (process.env.JWT_SECRET = SECRET))
  afterAll(() => (process.env.JWT_SECRET = original))

  it("uses auth_context when authentication middleware already ran", () => {
    expect(getOptionalCustomerId(req({}, { actor_id: "cus_ctx" }))).toBe("cus_ctx")
  })

  it("returns null for anonymous requests", () => {
    expect(getOptionalCustomerId(req())).toBeNull()
  })

  it("returns null for a non-Bearer authorization header", () => {
    expect(getOptionalCustomerId(req({ authorization: "Basic abc" }))).toBeNull()
  })

  it("reads the customer id from a valid customer token", () => {
    expect(getOptionalCustomerId(req(bearer({ actor_id: "cus_1", actor_type: "customer" })))).toBe("cus_1")
  })

  it("rejects tokens issued to sellers or admins", () => {
    expect(getOptionalCustomerId(req(bearer({ actor_id: "mem_1", actor_type: "seller" })))).toBeNull()
    expect(getOptionalCustomerId(req(bearer({ actor_id: "user_1", actor_type: "user" })))).toBeNull()
  })

  it("rejects a token signed with another secret", () => {
    expect(getOptionalCustomerId(req(bearer({ actor_id: "cus_1", actor_type: "customer" }, "wrong")))).toBeNull()
  })

  it("rejects an expired token", () => {
    expect(
      getOptionalCustomerId(req(bearer({ actor_id: "cus_1", actor_type: "customer" }, SECRET, { expiresIn: -10 })))
    ).toBeNull()
  })

  it("returns null for a token without an actor (e.g. mid-registration)", () => {
    expect(getOptionalCustomerId(req(bearer({ actor_id: "", actor_type: "customer" })))).toBeNull()
  })

  it("returns null for garbage tokens", () => {
    expect(getOptionalCustomerId(req({ authorization: "Bearer not.a.jwt" }))).toBeNull()
  })
})
