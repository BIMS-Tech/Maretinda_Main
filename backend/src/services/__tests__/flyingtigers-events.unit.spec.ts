import { mapFlyingTigersStatus, nextShipmentStatus, parseFlyingTigersEvent } from "../flyingtigers"

/** Flying Tigers' documented Shipment.deliveryStatus values and where each leaves a booking. */
describe("Flying Tigers delivery statuses", () => {
  it.each([
    ["Order placed", "pending_pickup"],
    ["Scheduled for Pickup", "pending_pickup"],
    ["For pickup orig.", "pickup_dispatched"],
    ["Picked up", "picked_up"],
    ["Package picked up", "picked_up"],
    ["Pick up failed- sender unavailable", "exception"],
    ["Pickup failed - Package not ready", "exception"],
    ["On hold - Requires documentation", "exception"],
    ["Orig. hub", "in_transit"],
    ["At origin hub", "in_transit"],
    ["Loaded for shipping", "in_transit"],
    ["In-transit", "in_transit"],
    ["Arrived at destination hub", "in_transit"],
    ["For pickup dest.", "in_transit"],
    ["Scheduled for Delivery", "out_for_delivery"],
    ["Rescheduled for delivery", "out_for_delivery"],
    ["Out for delivery reattempt", "out_for_delivery"],
    ["Delivered", "delivered"],
    ["Delivery failed - recipient unavailable", "exception"],
    ["Order cancelled", "cancelled"],
    ["Return to sender - initiated", "returning"],
    ["Return to sender - in transit", "returning"],
    ["Return to sender - delivered", "returned"],
    ["Lost", "failed"],
  ])("%s → %s", (status, internal) => {
    expect(mapFlyingTigersStatus(status)).toBe(internal)
  })

  it("leaves a status it doesn't know alone", () => {
    expect(mapFlyingTigersStatus("Custom")).toBeNull()
  })
})

describe("parseFlyingTigersEvent", () => {
  it("reads the shipment Flying Tigers nests under data", () => {
    // Trimmed from a real sandbox delivery to test-api on 2026-11-10
    const body = {
      businessId: 91,
      eventType: "shipment.created",
      sandbox: true,
      timestamp: "2026-11-10T19:35:10.665Z",
      data: {
        shipment: {
          isSandbox: true,
          trackingNumber: "TEST-CEB26AJTL",
          orderNumber: "order_01M72H1ZZHH5TJNPSXDV3J1YF9",
          deliveryStatus: "Order placed",
          status: "on going",
        },
      },
    }
    expect(parseFlyingTigersEvent(body)).toEqual({
      trackingNo: "TEST-CEB26AJTL",
      event: "shipment.created",
      status: "pending_pickup",
      timestamp: "2026-11-10T19:35:10.665Z",
    })
  })

  it("falls back to the shipment's overall status", () => {
    const body = { eventType: "shipment.updated", data: { shipment: { trackingNumber: "T1", status: "cancelled" } } }
    expect(parseFlyingTigersEvent(body).status).toBe("cancelled")
  })

  it("still reads the flat shape", () => {
    expect(parseFlyingTigersEvent({ tracking_no: "T2", event: "Delivered" })).toMatchObject({
      trackingNo: "T2",
      status: "delivered",
    })
  })

  it("has no tracking number for events that aren't about a shipment", () => {
    expect(parseFlyingTigersEvent({ eventType: "wallet.topup", data: {} }).trackingNo).toBeUndefined()
  })
})

describe("nextShipmentStatus", () => {
  it.each([
    ["pending_pickup", "picked_up", "picked_up"],
    ["picked_up", "delivered", "delivered"],
    ["in_transit", "exception", "exception"],
    ["exception", "out_for_delivery", "out_for_delivery"],
    ["delivered", "returning", "returning"],
  ])("%s then %s → %s", (current, incoming, next) => {
    expect(nextShipmentStatus(current, incoming)).toBe(next)
  })

  it.each([
    // A late "Order placed" must not reopen a cancelled or moving booking
    ["cancelled", "pending_pickup"],
    ["cancelled", "in_transit"],
    ["in_transit", "pending_pickup"],
    ["delivered", "in_transit"],
    ["returned", "delivered"],
  ])("keeps %s when %s arrives late", (current, incoming) => {
    expect(nextShipmentStatus(current, incoming)).toBe(current)
  })

  it("keeps the current status for an unknown one", () => {
    expect(nextShipmentStatus("in_transit", null)).toBe("in_transit")
  })
})
