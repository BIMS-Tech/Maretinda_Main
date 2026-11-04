import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import VoucherService from "../voucher"

const DAY = 24 * 60 * 60 * 1000
const future = () => new Date(Date.now() + DAY).toISOString()
const past = () => new Date(Date.now() - DAY).toISOString()

const promo = (over: Record<string, any> = {}) => ({
  id: "promo_1",
  code: "SAVE100",
  type: "standard",
  status: "active",
  ends_at: null,
  metadata: {},
  application_method: { type: "fixed", value: 100 },
  rules: [],
  ...over,
})

/**
 * Container with a fake promotion module and a knex whose raw() answers the
 * three queries VoucherService makes: the "has this customer ordered" check,
 * the collected-voucher lookups, and the INSERT.
 */
function setup({
  promotions = [] as any[],
  customerHasOrders = false,
  collected = [] as any[],
  linkRows = [] as any[],
} = {}) {
  const raw = jest.fn(async (sql: string, params: any[] = []) => {
    if (sql.includes('FROM "order"')) return { rows: customerHasOrders ? [{ "?column?": 1 }] : [] }
    if (sql.includes("SELECT * FROM customer_voucher WHERE customer_id = ? AND promotion_id = ?")) {
      return { rows: collected.filter((c) => c.customer_id === params[0] && c.promotion_id === params[1]) }
    }
    if (sql.includes("SELECT * FROM customer_voucher WHERE customer_id = ?")) {
      return { rows: collected.filter((c) => c.customer_id === params[0]) }
    }
    if (sql.includes("INSERT INTO customer_voucher")) {
      const [customer_id, promotion_id, promotion_code, expires_at] = params
      return { rows: [{ id: "cv_new", customer_id, promotion_id, promotion_code, expires_at }] }
    }
    return { rows: [] }
  })

  const listPromotions = jest.fn(async (filter: any) =>
    filter?.id ? promotions.filter((p) => filter.id.includes(p.id)) : promotions
  )

  // promotion_metadata and the seller link are read through the query builder.
  const builder: any = {
    whereIn: () => builder,
    whereNull: () => builder,
    leftJoin: () => builder,
    select: async () => linkRows,
  }
  const knex: any = Object.assign(() => builder, { raw })

  const container = {
    resolve: (key: string) => {
      if (key === Modules.PROMOTION) return { listPromotions }
      if (key === ContainerRegistrationKeys.PG_CONNECTION) return knex
      throw new Error(`unexpected resolve(${key})`)
    },
  }
  return { service: new VoucherService(container), raw, listPromotions }
}

describe("VoucherService.formatPromotion", () => {
  const { service } = setup()

  it("labels fixed discounts in pesos", () => {
    expect(service.formatPromotion(promo({ application_method: { type: "fixed", value: 1500 } })).discount_label).toBe(
      "₱1,500 off"
    )
  })

  it("labels percentage discounts", () => {
    expect(service.formatPromotion(promo({ application_method: { type: "percentage", value: 15 } })).discount_label).toBe(
      "15% off"
    )
  })

  it("falls back to a generic label", () => {
    expect(service.formatPromotion(promo({ application_method: null })).discount_label).toBe("Voucher")
  })

  it("converts the subtotal rule (centavos) into a peso min_order", () => {
    const p = promo({ rules: [{ attribute: "subtotal", values: [{ value: "50000" }] }] })
    expect(service.formatPromotion(p).min_order).toBe(500)
  })

  it("accepts scalar rule values", () => {
    const p = promo({ rules: [{ attribute: "subtotal", values: [100000] }] })
    expect(service.formatPromotion(p).min_order).toBe(1000)
  })

  it("leaves min_order undefined for a zero or non-numeric rule", () => {
    expect(service.formatPromotion(promo({ rules: [{ attribute: "subtotal", values: [{ value: "0" }] }] })).min_order).toBeUndefined()
    expect(service.formatPromotion(promo({ rules: [{ attribute: "subtotal", values: [{ value: "abc" }] }] })).min_order).toBeUndefined()
  })

  it("scopes promotions with a seller_id to that seller", () => {
    const f = service.formatPromotion(promo({ metadata: { seller_id: "sel_1", seller_name: "Shop" } }))
    expect(f).toMatchObject({ scope: "seller", seller_id: "sel_1", seller_name: "Shop" })
  })

  it("defaults to platform scope", () => {
    expect(service.formatPromotion(promo()).scope).toBe("platform")
  })

  it("reflects collected state", () => {
    expect(service.formatPromotion(promo()).is_collected).toBe(false)
    const f = service.formatPromotion(promo(), { id: "cv_1" } as any)
    expect(f).toMatchObject({ is_collected: true, collected_voucher_id: "cv_1" })
  })
})

describe("VoucherService.listAvailablePromotions", () => {
  const platform = promo({ id: "p_platform" })
  const expired = promo({ id: "p_expired", ends_at: past() })
  const sellerA = promo({ id: "p_seller_a" })
  const sellerB = promo({ id: "p_seller_b" })
  const firstOrder = promo({ id: "p_first" })
  // One fake table answers both lookups; extras are ignored by whichever map reads them.
  const linkRows = [
    { promotion_id: "p_seller_a", seller_id: "sel_a", seller_name: "Shop A", metadata: {} },
    { promotion_id: "p_seller_b", seller_id: "sel_b", seller_name: "Shop B", metadata: {} },
  ]
  const firstOrderRows = [{ promotion_id: "p_first", metadata: { first_order_only: true } }]

  it("only asks the promotion module for active promotions", async () => {
    const { service, listPromotions } = setup({ promotions: [platform] })
    await service.listAvailablePromotions()
    expect(listPromotions.mock.calls[0][0]).toEqual({ status: ["active"] })
  })

  it("hides expired promotions", async () => {
    const { service } = setup({ promotions: [platform, expired] })
    const ids = (await service.listAvailablePromotions()).map((p) => p.id)
    expect(ids).toEqual(["p_platform"])
  })

  it("shows platform and seller promotions without a seller filter", async () => {
    const { service } = setup({ promotions: [platform, sellerA, sellerB], linkRows })
    const ids = (await service.listAvailablePromotions()).map((p) => p.id)
    expect(ids).toEqual(["p_platform", "p_seller_a", "p_seller_b"])
  })

  it("limits a seller filter to that seller's promotions", async () => {
    const { service } = setup({ promotions: [platform, sellerA, sellerB], linkRows })
    const ids = (await service.listAvailablePromotions(undefined, "sel_a")).map((p) => p.id)
    expect(ids).toEqual(["p_seller_a"])
  })

  it("shows first-order vouchers to anonymous visitors and new customers", async () => {
    expect((await setup({ promotions: [firstOrder] }).service.listAvailablePromotions()).map((p) => p.id)).toEqual([
      "p_first",
    ])
    expect(
      (await setup({ promotions: [firstOrder] }).service.listAvailablePromotions("cus_new")).map((p) => p.id)
    ).toEqual(["p_first"])
  })

  it("hides first-order vouchers from customers who have ordered", async () => {
    const { service } = setup({ promotions: [platform, firstOrder], customerHasOrders: true, linkRows: firstOrderRows })
    const ids = (await service.listAvailablePromotions("cus_returning")).map((p) => p.id)
    expect(ids).toEqual(["p_platform"])
  })

  it("marks promotions the customer already collected", async () => {
    const { service } = setup({
      promotions: [platform, sellerA],
      collected: [{ id: "cv_1", customer_id: "cus_1", promotion_id: "p_seller_a" }],
    })
    const list = await service.listAvailablePromotions("cus_1")
    expect(list.map((p) => [p.id, p.is_collected])).toEqual([
      ["p_platform", false],
      ["p_seller_a", true],
    ])
  })
})

describe("VoucherService.collectVoucher", () => {
  it("rejects an unknown promotion", async () => {
    const { service } = setup()
    await expect(service.collectVoucher("cus_1", "nope")).rejects.toThrow("Promotion not found")
  })

  it("rejects an inactive promotion", async () => {
    const { service } = setup({ promotions: [promo({ status: "inactive" })] })
    await expect(service.collectVoucher("cus_1", "promo_1")).rejects.toThrow("no longer available")
  })

  it("rejects an expired promotion", async () => {
    const { service } = setup({ promotions: [promo({ ends_at: past() })] })
    await expect(service.collectVoucher("cus_1", "promo_1")).rejects.toThrow("expired")
  })

  it("blocks returning customers from first-order vouchers", async () => {
    const { service } = setup({
      promotions: [promo()],
      customerHasOrders: true,
      linkRows: [{ promotion_id: "promo_1", metadata: { first_order_only: true } }],
    })
    await expect(service.collectVoucher("cus_1", "promo_1")).rejects.toThrow("only for first-time buyers")
  })

  it("collects a voucher with the promotion's expiry", async () => {
    const ends_at = future()
    const { service } = setup({ promotions: [promo({ ends_at })] })
    const cv = await service.collectVoucher("cus_1", "promo_1")
    expect(cv).toMatchObject({ id: "cv_new", customer_id: "cus_1", promotion_id: "promo_1", promotion_code: "SAVE100", expires_at: ends_at })
  })

  it("is idempotent — returns the existing voucher instead of inserting", async () => {
    const existing = { id: "cv_old", customer_id: "cus_1", promotion_id: "promo_1" }
    const { service, raw } = setup({ promotions: [promo()], collected: [existing] })
    expect(await service.collectVoucher("cus_1", "promo_1")).toEqual(existing)
    expect(raw.mock.calls.some(([sql]) => sql.includes("INSERT INTO customer_voucher"))).toBe(false)
  })
})

describe("VoucherService.listMyVouchers", () => {
  it("returns nothing without touching the promotion module when none are collected", async () => {
    const { service, listPromotions } = setup()
    expect(await service.listMyVouchers("cus_1")).toEqual([])
    expect(listPromotions).not.toHaveBeenCalled()
  })

  it("keeps a voucher whose promotion was deleted, as a generic platform voucher", async () => {
    const { service } = setup({
      collected: [{ id: "cv_1", customer_id: "cus_1", promotion_id: "gone", promotion_code: "OLD", expires_at: null }],
    })
    expect(await service.listMyVouchers("cus_1")).toEqual([
      expect.objectContaining({ id: "gone", code: "OLD", discount_label: "Voucher", scope: "platform", is_collected: true }),
    ])
  })
})
