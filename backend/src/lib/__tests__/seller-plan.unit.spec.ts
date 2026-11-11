import { closedShopMessage, vendorRequestNeedsPlan } from "../seller-plan"

describe("vendorRequestNeedsPlan", () => {
  it.each([
    ["POST", "/vendor/products"],
    ["DELETE", "/vendor/products/prod_1"],
    ["POST", "/vendor/stock-locations"],
    ["POST", "/vendor/shipping-options/so_1"],
    ["POST", "/vendor/promotions"],
    ["POST", "/vendor/reels"],
    ["POST", "/vendor/sellersfake"],
    ["POST", "/vendor/fulfillment-sets/fs_1/service-zones"],
    ["POST", "/vendor/uploads"],
    ["POST", "/vendor/3d-models"],
  ])("needs a plan to %s %s", (method, path) => {
    expect(vendorRequestNeedsPlan(method, path)).toBe(true)
  })

  it.each([
    ["GET", "/vendor/products"],
    ["POST", "/vendor/subscription/trial"],
    ["POST", "/vendor/subscription/checkout"],
    ["POST", "/vendor/sellers/me"],
    ["POST", "/vendor/orders/order_1/capture"],
    ["POST", "/vendor/orders/order_1/fulfillments"],
    ["POST", "/vendor/returns/ret_1/receive"],
    // Answering a buyer's return request is finishing an existing order
    ["POST", "/vendor/return-request/oretreq_1"],
    ["POST", "/vendor/shipping-orders"],
    ["POST", "/vendor/chat/conv_1/message"],
    ["POST", "/vendor/payout-account"],
    ["POST", "/vendor/invites/accept"],
  ])("lets %s %s through without a plan", (method, path) => {
    expect(vendorRequestNeedsPlan(method, path)).toBe(false)
  })
})

describe("closedShopMessage", () => {
  it("names the shop", () => {
    expect(closedShopMessage(["Closed Shop"])).toBe("Closed Shop isn't taking orders right now. Remove its items to check out.")
  })

  it("names several shops", () => {
    expect(closedShopMessage(["A", "B"])).toBe("A and B aren't taking orders right now. Remove their items to check out.")
  })
})
