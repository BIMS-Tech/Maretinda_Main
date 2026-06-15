import { ShoppingBag, ExclamationCircle, CheckCircle, ArrowRight } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link, useLoaderData } from "react-router-dom"

import { useStockLocations } from "../../../hooks/api/stock-locations"
import LocationListItem from "./components/location-list-item/location-list-item"
import { LOCATION_LIST_FIELDS } from "./constants"
import { shippingListLoader } from "./loader"

import { TwoColumnPage } from "../../../components/layout/pages"
import { useDashboardExtension } from "../../../extensions"
import { LocationListHeader } from "./components/location-list-header"
import { SidebarLink } from "../../../components/common/sidebar-link/sidebar-link"

function ShippingSetupBanner({ stockLocations }: { stockLocations: any[] }) {
  const hasLocation = stockLocations.length > 0
  const hasShippingSet = stockLocations.some((loc) =>
    loc.fulfillment_sets?.some((fs: any) => fs.type === "shipping")
  )
  const hasServiceZone = stockLocations.some((loc) =>
    loc.fulfillment_sets?.some((fs: any) =>
      fs.type === "shipping" && (fs.service_zones?.length ?? 0) > 0
    )
  )
  const hasShippingOptions = stockLocations.some((loc) =>
    loc.fulfillment_sets?.some((fs: any) =>
      fs.type === "shipping" &&
      fs.service_zones?.some((sz: any) => (sz.shipping_options?.length ?? 0) > 0)
    )
  )

  if (hasLocation && hasShippingSet && hasServiceZone && hasShippingOptions) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-2">
        <CheckCircle className="text-green-500 w-4 h-4 flex-shrink-0" />
        <Text size="xsmall" className="text-green-600 dark:text-green-400">
          Checkout shipping is set up. Customers can select shipping options at checkout.
        </Text>
        <Link to="/shipping?tab=guide" className="ml-auto text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
          View Guide <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  const steps = [
    { done: hasLocation, label: "Create a warehouse location" },
    { done: hasShippingSet, label: "Enable Shipping on your location" },
    { done: hasServiceZone, label: "Add a Philippines service zone" },
    { done: hasShippingOptions, label: "Add shipping options with prices" },
  ]
  const nextStep = steps.find((s) => !s.done)
  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-2">
      <div className="flex items-start gap-3">
        <ExclamationCircle className="text-amber-500 w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text size="small" weight="plus" className="text-amber-600 dark:text-amber-400">
              Checkout shipping setup incomplete
            </Text>
            <Badge color="orange" size="2xsmall">{doneCount}/4 steps done</Badge>
          </div>
          {nextStep && (
            <Text size="xsmall" className="text-ui-fg-subtle">
              Next: <strong>{nextStep.label}</strong>
            </Text>
          )}
          <Link to="/shipping?tab=guide" className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline">
            View Setup Guide <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function LocationList() {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof shippingListLoader>
  >

  const {
    stock_locations: stockLocations = [],
    isError,
    error,
  } = useStockLocations(
    {
      fields: LOCATION_LIST_FIELDS,
    },
    { initialData }
  )

  const { getWidgets } = useDashboardExtension()

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("location.details.after"),
        before: getWidgets("location.details.before"),
        sideAfter: getWidgets("location.details.side.after"),
        sideBefore: getWidgets("location.details.side.before"),
      }}
    >
      <TwoColumnPage.Main>
        <LocationListHeader />
        <ShippingSetupBanner stockLocations={stockLocations as any[]} />
        <div className="flex flex-col gap-3 lg:col-span-2">
          {stockLocations.map((location) => (
            <LocationListItem key={location.id} location={location} />
          ))}
        </div>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <LinksSection />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

const LinksSection = () => {
  const { t } = useTranslation()

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("stockLocations.sidebar.header")}</Heading>
      </div>

      <SidebarLink
        to="/settings/locations/shipping-profiles"
        labelKey={t("stockLocations.sidebar.shippingProfiles.label")}
        descriptionKey={t(
          "stockLocations.sidebar.shippingProfiles.description"
        )}
        icon={<ShoppingBag />}
      />
    </Container>
  )
}
