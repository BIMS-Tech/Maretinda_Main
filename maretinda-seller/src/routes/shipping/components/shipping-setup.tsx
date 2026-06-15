/**
 * Centralized Shipping Carriers — Vendor View (Read-Only)
 *
 * Vendors no longer configure their own carrier accounts.
 * Maretinda manages one platform-level account per carrier.
 * This page shows which carriers are available and how to use them.
 */

import { useQuery } from "@tanstack/react-query"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { CheckCircle, XCircle, ArrowUpRightOnBox } from "@medusajs/icons"
import { fetchQuery } from "../../../lib/client"

type PlatformCarrier = {
  provider_id: string
  name: string
  type: string
  markets: string[]
  capabilities: string[]
  is_active: boolean
  supports_cod: boolean
  tracking_url_template: string
}

function useAvailableCarriers() {
  return useQuery({
    queryKey: ["vendor", "shipping-providers"],
    queryFn: async () => {
      const data = await fetchQuery("/vendor/shipping-providers", { method: "GET" })
      return data as { providers: PlatformCarrier[]; message: string }
    },
  })
}

const CARRIER_ICONS: Record<string, string> = {
  ninjavan: "🟢",
  flyingtigers: "🐯",
}

function CarrierCard({ carrier }: { carrier: PlatformCarrier }) {
  return (
    <Container className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-ui-bg-subtle flex items-center justify-center text-xl">
            {CARRIER_ICONS[carrier.provider_id] ?? "📦"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Heading level="h3">{carrier.name}</Heading>
              {carrier.is_active ? (
                <CheckCircle className="text-green-500 w-4 h-4" />
              ) : (
                <XCircle className="text-ui-fg-muted w-4 h-4" />
              )}
              {carrier.is_active && <Badge color="green" size="2xsmall">Available</Badge>}
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {carrier.markets.join(" · ")} · {carrier.type}
            </Text>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {carrier.capabilities.map((cap) => (
                <Badge key={cap} color={cap === "COD" ? "orange" : cap.includes("day") ? "purple" : "grey"} size="2xsmall">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {!carrier.is_active && <Badge color="grey" size="2xsmall">Coming soon</Badge>}
      </div>

      {carrier.supports_cod && carrier.is_active && (
        <div className="mt-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Text size="xsmall" className="text-amber-600 dark:text-amber-400">
            Cash on Delivery supported — enable COD when creating a shipment
          </Text>
        </div>
      )}
    </Container>
  )
}

export function ShippingSetup() {
  const { data, isLoading } = useAvailableCarriers()
  const carriers = data?.providers ?? []
  const activeCount = carriers.filter((c) => c.is_active).length

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="bg-blue-500/10 border border-blue-500/20 p-5">
        <Heading level="h3" className="text-blue-600 dark:text-blue-400 mb-1">
          Maretinda Managed Shipping
        </Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Maretinda provides shipping through its own carrier accounts — you don't need to set up or
          pay for your own courier subscriptions. Simply book shipments from the{" "}
          <strong>Shipments</strong> tab and Maretinda handles billing and coordination.
        </Text>
      </Container>

      <div className="flex items-center justify-between">
        <div>
          <Heading level="h2">Available Carriers</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {activeCount > 0
              ? `${activeCount} carrier${activeCount > 1 ? "s" : ""} ready to use`
              : "Carriers are being set up — check back soon"}
          </Text>
        </div>
      </div>

      {isLoading ? (
        <Container className="p-8 text-center">
          <Text className="text-ui-fg-muted">Loading carriers...</Text>
        </Container>
      ) : carriers.length === 0 ? (
        <Container className="p-8 text-center">
          <Text className="text-ui-fg-muted">{data?.message ?? "No carriers available yet. Contact Maretinda support."}</Text>
        </Container>
      ) : (
        <div className="flex flex-col gap-3">
          {carriers.map((carrier) => (
            <CarrierCard key={carrier.provider_id} carrier={carrier} />
          ))}
        </div>
      )}

      <Container className="p-6">
        <Heading level="h3" className="mb-4">How Shipping Works</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Order comes in", desc: "Customer places an order. Pack the items and weigh the parcel." },
            { step: "2", title: "Book a shipment", desc: "Go to Shipments → Create. Pick a carrier, enter parcel details, and confirm. A waybill PDF is generated instantly." },
            { step: "3", title: "Hand off & track", desc: "Print and attach the waybill. The carrier collects and tracking updates automatically." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Text size="xsmall" weight="plus" className="text-blue-600 dark:text-blue-400">{step}</Text>
              </div>
              <div>
                <Text size="small" weight="plus">{title}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle mt-0.5">{desc}</Text>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <a
            href="https://help.maretinda.com/shipping"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-500 hover:text-blue-400 text-sm"
          >
            Shipping guide & FAQs <ArrowUpRightOnBox className="w-3.5 h-3.5" />
          </a>
        </div>
      </Container>
    </div>
  )
}
