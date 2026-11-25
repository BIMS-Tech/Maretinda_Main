import { Container, Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { Link } from "react-router-dom"

import { HowTo } from "../../../components/common/how-to"

const A = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-ui-fg-interactive hover:underline">
    {children}
  </Link>
)

/** What to do when an order comes in: directions only, the setup has its own tab. */
export function ShippingGuide() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Container className="p-6">
        <Heading level="h2">When an order comes in</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          New here? Do <A to="/shipping?tab=setup">Set up delivery</A> first. Then follow these steps for every order.
        </Text>
      </Container>

      <HowTo
        id="ship-pack"
        title="1. Pack it, and keep proof"
        steps={[
          <>
            Open the order under <A to="/orders">Orders</A> and check every item, size and quantity.
          </>,
          "Wrap it for the trip: bubble wrap and a box for anything fragile.",
          <>
            Take a clear photo or short video showing <b>the items and quantity</b>, <b>their condition before sealing</b>, and{" "}
            <b>the waybill on the sealed parcel</b>. If a buyer later says it was empty or wrong, this is what decides the dispute.
          </>,
        ]}
      />
      <HowTo
        id="ship-maretinda"
        title="2a. Ship with a courier booked through Maretinda"
        steps={[
          <>
            In <A to="/shipping?tab=shipments">Shipments</A>, press <b>Create Shipment</b>, choose the order and the courier, and enter
            the weight and size.
          </>,
          "Print the waybill and stick it on the parcel. The order is marked packed.",
          "Hand the parcel to the rider. When the courier scans it, the order is marked shipped, and delivered when it arrives. The buyer is emailed each time.",
          "Cash on delivery: the courier collects the cash and passes it to Maretinda. You see it under Payouts & Invoices.",
        ]}
        note="Flying Tigers delivers to selected provinces. If the address isn't covered, booking tells you straight away: use your own courier instead."
      />
      <HowTo
        id="ship-own"
        title="2b. Ship with your own courier"
        steps={[
          "Book any courier you like and get the tracking number.",
          <>
            Open the order, press <b>Fulfill items</b>, then <b>Mark as shipped</b> and enter the tracking number, so the buyer can follow it.
          </>,
          <>
            When it arrives, press <b>Mark as delivered</b>. Your payout is counted from delivery, so don't forget this step.
          </>,
        ]}
      />
      <HowTo
        id="ship-after"
        title="3. After delivery"
        steps={[
          "The buyer has 7 days from delivery to ask for a return.",
          "You are paid 14 days after delivery, unless a return is open for that order.",
          <>
            If a buyer asks for a return, answer it under <A to="/requests/orders">Requests → Returns</A> in time.
          </>,
        ]}
      />
    </div>
  )
}
