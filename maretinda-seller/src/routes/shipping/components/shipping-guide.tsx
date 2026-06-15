import { useQuery } from "@tanstack/react-query"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import {
  CheckCircle,
  ArrowRight,
  Buildings,
  TruckFast,
  CogSixTooth,
  InformationCircle,
} from "@medusajs/icons"
import { Link } from "react-router-dom"
import { fetchQuery } from "../../../lib/client"
import { HttpTypes } from "@medusajs/types"

type SetupStepProps = {
  number: number
  done: boolean
  title: string
  description: string
  action?: { label: string; to: string }
}

function SetupStep({ number, done, title, description, action }: SetupStepProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
        ${done
          ? "bg-green-500/10 text-green-600"
          : "bg-ui-bg-subtle text-ui-fg-muted border border-ui-border-base"}`}>
        {done ? <CheckCircle className="w-5 h-5 text-green-500" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text size="small" weight="plus" className={done ? "text-ui-fg-subtle line-through" : ""}>
            {title}
          </Text>
          {done && <Badge color="green" size="2xsmall">Done</Badge>}
        </div>
        <Text size="xsmall" className="text-ui-fg-subtle mt-0.5">{description}</Text>
        {!done && action && (
          <Link
            to={action.to}
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-500 hover:text-blue-400"
          >
            {action.label} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

function useLocationsSetupStatus() {
  return useQuery({
    queryKey: ["vendor", "locations", "setup-status"],
    queryFn: async () => {
      const data = await fetchQuery("/vendor/stock-locations", {
        method: "GET",
        query: {
          fields: "name,*fulfillment_sets,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options",
        },
      }) as HttpTypes.AdminStockLocationListResponse

      const locations = (data as any).stock_locations ?? []
      const hasLocation = locations.length > 0
      const hasShippingFulfillmentSet = locations.some((loc: any) =>
        loc.fulfillment_sets?.some((fs: any) => fs.type === "shipping")
      )
      const hasServiceZone = locations.some((loc: any) =>
        loc.fulfillment_sets?.some((fs: any) =>
          fs.type === "shipping" && (fs.service_zones?.length ?? 0) > 0
        )
      )
      const hasShippingOptions = locations.some((loc: any) =>
        loc.fulfillment_sets?.some((fs: any) =>
          fs.type === "shipping" &&
          fs.service_zones?.some((sz: any) => (sz.shipping_options?.length ?? 0) > 0)
        )
      )
      return { hasLocation, hasShippingFulfillmentSet, hasServiceZone, hasShippingOptions }
    },
  })
}

function useCarrierStatus() {
  return useQuery({
    queryKey: ["vendor", "shipping-providers", "guide-status"],
    queryFn: async () => {
      const data = await fetchQuery("/vendor/shipping-providers", { method: "GET" }) as any
      const providers = data?.providers ?? []
      return { activeCount: providers.filter((p: any) => p.is_active).length }
    },
  })
}

export function ShippingGuide() {
  const { data: setup } = useLocationsSetupStatus()
  const { data: carriers } = useCarrierStatus()

  const checkoutReady =
    setup?.hasLocation &&
    setup?.hasShippingFulfillmentSet &&
    setup?.hasServiceZone &&
    setup?.hasShippingOptions

  const carrierReady = (carriers?.activeCount ?? 0) > 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Overview */}
      <Container className="p-5">
        <div className="flex items-start gap-3">
          <InformationCircle className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <Heading level="h3" className="text-blue-600 dark:text-blue-400">
              Two-Track Shipping System
            </Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Shipping has two separate concerns that work together:
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
                <div className="flex items-center gap-2 mb-1">
                  <Buildings className="w-4 h-4 text-ui-fg-muted" />
                  <Text size="xsmall" weight="plus">Checkout Pricing</Text>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  What customers see at checkout — your zones, delivery names and prices.
                  Configured in <strong>Settings → Locations</strong>.
                </Text>
              </div>
              <div className="p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
                <div className="flex items-center gap-2 mb-1">
                  <TruckFast className="w-4 h-4 text-ui-fg-muted" />
                  <Text size="xsmall" weight="plus">Carrier Booking</Text>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Actually dispatching the parcel via NinjaVan or Flying Tigers.
                  Done in the <strong>Shipments</strong> tab after an order.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Track 1: Checkout setup */}
      <Container className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Buildings className="w-5 h-5 text-ui-fg-muted" />
            <Heading level="h3">Track 1 — Checkout Setup</Heading>
          </div>
          {checkoutReady
            ? <Badge color="green" size="2xsmall">Complete</Badge>
            : <Badge color="orange" size="2xsmall">Incomplete</Badge>}
        </div>
        <Text size="small" className="text-ui-fg-subtle mb-5">
          Configure this <strong>once</strong> in <strong>Settings → Locations</strong>.
          Customers will see these options at checkout when buying your products.
        </Text>

        <div className="flex flex-col gap-5">
          <SetupStep
            number={1}
            done={!!setup?.hasLocation}
            title="Create your warehouse location"
            description="Add your store or warehouse address. This is the origin point for all your shipments."
            action={{ label: "Create Location", to: "/settings/locations/create" }}
          />
          <SetupStep
            number={2}
            done={!!setup?.hasShippingFulfillmentSet}
            title="Enable Shipping on your location"
            description="Open your location → Add Fulfillment Set → select type Shipping."
            action={{ label: "Open Locations", to: "/settings/locations" }}
          />
          <SetupStep
            number={3}
            done={!!setup?.hasServiceZone}
            title="Create a Philippines service zone"
            description="Inside your Shipping fulfillment set → Add Service Zone → Country: Philippines (PH)."
            action={{ label: "Open Locations", to: "/settings/locations" }}
          />
          <SetupStep
            number={4}
            done={!!setup?.hasShippingOptions}
            title="Add shipping options with prices"
            description="Inside your Philippines zone → Add Shipping Option. Create Standard, Express, or COD options with your PHP pricing."
            action={{ label: "Open Locations", to: "/settings/locations" }}
          />
        </div>

        {checkoutReady && (
          <div className="mt-5 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Text size="xsmall" className="text-green-600 dark:text-green-400">
              Your checkout shipping is ready. Customers can now select a shipping method when ordering your products.
            </Text>
          </div>
        )}
      </Container>

      {/* Track 2: Carrier booking */}
      <Container className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CogSixTooth className="w-5 h-5 text-ui-fg-muted" />
            <Heading level="h3">Track 2 — Carrier Booking</Heading>
          </div>
          {carrierReady
            ? <Badge color="green" size="2xsmall">{carriers!.activeCount} carrier{carriers!.activeCount > 1 ? "s" : ""} ready</Badge>
            : <Badge color="grey" size="2xsmall">Awaiting admin setup</Badge>}
        </div>
        <Text size="small" className="text-ui-fg-subtle mb-5">
          Maretinda manages carrier accounts centrally — you don't configure credentials.
          When an order comes in, go to the <strong>Shipments</strong> tab to book the physical delivery.
        </Text>

        <div className="flex flex-col gap-5">
          <SetupStep
            number={1}
            done={carrierReady}
            title="Maretinda activates carriers"
            description="NinjaVan and Flying Tigers are configured by Maretinda admin. No action needed from you."
          />
          <SetupStep
            number={2}
            done={false}
            title="Order received → pack the parcel"
            description="When a customer places an order, pack the items and note the weight and dimensions."
          />
          <SetupStep
            number={3}
            done={false}
            title="Book a shipment in the Shipments tab"
            description="Go to Shipments → Create. Select the order, choose a carrier (NinjaVan or Flying Tigers), enter parcel details. A waybill PDF is generated."
            action={{ label: "Go to Shipments", to: "/shipping" }}
          />
          <SetupStep
            number={4}
            done={false}
            title="Print waybill and hand off"
            description="Print and attach the waybill to the parcel. The carrier collects it and tracking updates automatically."
          />
        </div>
      </Container>

      {/* Quick links */}
      <Container className="p-5">
        <Heading level="h3" className="mb-3">Quick Links</Heading>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "My Locations", to: "/settings/locations" },
            { label: "Shipping Profiles", to: "/settings/locations/shipping-profiles" },
            { label: "Available Carriers", to: "/shipping" },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ui-bg-subtle border border-ui-border-base text-sm text-ui-fg-base hover:bg-ui-bg-subtle-hover"
            >
              {label} <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </Container>

    </div>
  )
}
