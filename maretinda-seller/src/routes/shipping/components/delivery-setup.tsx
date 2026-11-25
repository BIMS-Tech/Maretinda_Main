import { CheckCircleSolid, ExclamationCircleSolid } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { ReactNode, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { HowTo } from "../../../components/common/how-to"
import { DeliverySetup as Setup, Pickup, useDeliverySetup, useSaveDeliverySetup, useStock } from "../../../hooks/api/delivery-setup"
import phLocations from "../../../lib/ph-locations.json"

const CITIES = phLocations as Record<string, string[]>
const PROVINCES = Object.keys(CITIES)

const SELECT =
  "bg-ui-bg-field border-ui-border-base text-ui-fg-base h-8 w-full rounded-md border px-2 text-sm disabled:opacity-60"

/** "pampanga" or "Pampanga " from an older record still finds its province in the list. */
const matching = (list: string[], value: string) =>
  list.find((x) => x.toLowerCase() === value.trim().toLowerCase()) ?? ""

const Step = ({ done, title, children }: { done: boolean; title: string; children: ReactNode }) => (
  <div className="flex items-start gap-3">
    {done ? (
      <CheckCircleSolid className="text-ui-tag-green-icon mt-0.5 shrink-0" />
    ) : (
      <ExclamationCircleSolid className="text-ui-tag-orange-icon mt-0.5 shrink-0" />
    )}
    <div className="min-w-0">
      <Text size="small" weight="plus">
        {title}
      </Text>
      <Text size="small" className="text-ui-fg-subtle">
        {children}
      </Text>
    </div>
  </div>
)

const Field = ({ label, children, hint, wide }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) => (
  <div className={wide ? "sm:col-span-2" : undefined}>
    <Label size="small" weight="plus" className="mb-1 block">
      {label}
    </Label>
    {children}
    {hint && <p className="text-ui-fg-muted mt-1 text-xs">{hint}</p>}
  </div>
)

const feeOf = (setup: Setup, code: string) => {
  const fee = setup.options.find((o) => o.code === code)?.fee
  return fee === null || fee === undefined ? "" : String(fee)
}

const Form = ({ setup }: { setup: Setup }) => {
  const start = setup.location ?? setup.suggested_pickup
  const province = matching(PROVINCES, start.province)
  const [pickup, setPickup] = useState<Pickup>({
    ...start,
    address_2: start.address_2 ?? "",
    phone: start.phone || setup.suggested_pickup.phone,
    province,
    city: matching(CITIES[province] ?? [], start.city),
  })
  const [standard, setStandard] = useState(feeOf(setup, "standard"))
  const [express, setExpress] = useState(feeOf(setup, "express"))
  const [offerExpress, setOfferExpress] = useState(feeOf(setup, "express") !== "")
  const [error, setError] = useState("")
  const save = useSaveDeliverySetup()

  const set = (key: keyof Pickup) => (value: string) => setPickup((p) => ({ ...p, [key]: value }))

  const submit = async () => {
    setError("")
    try {
      const result = await save.mutateAsync({
        pickup: { ...pickup, address_2: pickup.address_2 || null },
        fees: { standard, express: offerExpress ? express : null },
      })
      toast.success(
        result.published
          ? `Delivery is set up. ${result.published} product${result.published === 1 ? "" : "s"} you published earlier went live.`
          : "Delivery is set up."
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Please try again.")
    }
  }

  return (
    <Container className="divide-y p-0" data-testid="delivery-setup-form">
      <div className="px-6 py-4">
        <Heading level="h2">1. Where couriers pick up</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Your stock is kept here, and couriers collect parcels from this address. Buyers don't see it.
        </Text>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name of the place" hint="For example: Main store, Home, Warehouse">
            <Input size="small" value={pickup.name} onChange={(e) => set("name")(e.target.value)} />
          </Field>
          <Field label="Phone for the courier">
            <Input size="small" type="tel" value={pickup.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="0917 123 4567" />
          </Field>
          <Field label="House no., building, street" wide>
            <Input size="small" value={pickup.address_1} onChange={(e) => set("address_1")(e.target.value)} />
          </Field>
          <Field label="Barangay">
            <Input size="small" value={pickup.address_2 ?? ""} onChange={(e) => set("address_2")(e.target.value)} />
          </Field>
          <Field label="ZIP code">
            <Input size="small" inputMode="numeric" maxLength={4} value={pickup.postal_code} onChange={(e) => set("postal_code")(e.target.value)} />
          </Field>
          <Field label="Province">
            <select
              aria-label="Province"
              className={SELECT}
              value={pickup.province}
              onChange={(e) => setPickup((p) => ({ ...p, province: e.target.value, city: "" }))}
            >
              <option value="">Choose a province</option>
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="City or municipality">
            <select
              aria-label="City or municipality"
              className={SELECT}
              value={pickup.city}
              disabled={!pickup.province}
              onChange={(e) => set("city")(e.target.value)}
            >
              <option value="">Choose a city</option>
              {(CITIES[pickup.province] ?? []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="px-6 py-4">
        <Heading level="h2">2. What buyers pay for delivery</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          One fee for the whole Philippines. Buyers see it at checkout before they pay.
        </Text>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Standard delivery fee (₱)" hint="Enter 0 to always ship for free.">
            <Input
              size="small"
              type="number"
              min={0}
              step="0.01"
              aria-label="Standard delivery fee"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              placeholder="120"
            />
          </Field>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Switch checked={offerExpress} onCheckedChange={setOfferExpress} id="offer-express" />
              <Label size="small" weight="plus" htmlFor="offer-express">
                Also offer express (₱)
              </Label>
            </div>
            <Input
              size="small"
              type="number"
              min={0}
              step="0.01"
              aria-label="Express delivery fee"
              disabled={!offerExpress}
              value={express}
              onChange={(e) => setExpress(e.target.value)}
              placeholder="250"
            />
            <p className="text-ui-fg-muted mt-1 text-xs">Only if you can have it delivered in 1–3 days.</p>
          </div>
        </div>
        <div className="bg-ui-bg-subtle border-ui-border-base mt-4 rounded-md border px-3 py-2">
          <Text size="xsmall" className="text-ui-fg-subtle">
            Maretinda promises buyers free delivery on orders of ₱499 or more from your shop. On those orders you cover the
            delivery fee, so keep it in mind when you set your prices.
          </Text>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        {error ? (
          <Text size="small" className="text-ui-fg-error" role="alert">
            {error}
          </Text>
        ) : (
          <Text size="xsmall" className="text-ui-fg-muted">
            You can change these any time. Orders already placed keep the fee they were placed with.
          </Text>
        )}
        <Button size="small" onClick={submit} isLoading={save.isPending} data-testid="delivery-setup-save">
          {setup.ready ? "Save changes" : "Set up delivery"}
        </Button>
      </div>
    </Container>
  )
}

/** Guided delivery setup: pickup place, delivery fee, stock. */
export const DeliverySetupTab = () => {
  const { data, isPending, isError, refetch } = useDeliverySetup()
  const { data: stock } = useStock({ limit: 1 })
  const [key, setKey] = useState(0)

  // A fresh form once the saved values arrive, so it starts from them
  useEffect(() => setKey((k) => k + 1), [data?.location?.id])

  if (isPending) return <Text className="text-ui-fg-muted py-8 text-center">Loading…</Text>
  if (isError || !data) {
    return (
      <Container className="flex flex-col items-center gap-3 py-10">
        <Text className="text-ui-fg-subtle">Couldn't load your delivery setup.</Text>
        <Button size="small" variant="secondary" onClick={() => refetch()}>
          Try again
        </Button>
      </Container>
    )
  }

  const unset = stock?.counts.unset ?? 0
  const pickupDone = !!data.location && !data.missing.some((m) => m.startsWith("pickup"))
  const feeDone = !data.missing.includes("delivery fee") && !data.missing.includes("delivery area")

  return (
    <div className="flex flex-col gap-4" data-testid="delivery-setup" data-ready={String(data.ready)}>
      <Container className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Heading level="h2">{data.ready ? "Buyers can check out with your products" : "Set up delivery"}</Heading>
          <Badge size="2xsmall" color={data.ready ? "green" : "orange"}>
            {data.ready ? "Ready" : "Not ready yet"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Step done={pickupDone} title="Pickup place">
            {pickupDone ? `${data.location!.name}, ${data.location!.city}` : "Where couriers collect your parcels"}
          </Step>
          <Step done={feeDone} title="Delivery fee">
            {feeDone
              ? data.options
                  .filter((o) => o.fee !== null)
                  .map((o) => `${o.name.replace(" Delivery", "")} ₱${o.fee}`)
                  .join(", ")
              : "What buyers pay for delivery"}
          </Step>
          <Step done={!!stock && stock.counts.all > 0 && unset === 0} title="Stock">
            {!stock || stock.counts.all === 0 ? (
              <Link to="/products/create" className="text-ui-fg-interactive hover:underline">
                Add your first product
              </Link>
            ) : unset ? (
              <Link to="/inventory" className="text-ui-fg-interactive hover:underline">
                Enter stock for {unset} item{unset === 1 ? "" : "s"}
              </Link>
            ) : (
              "Entered for every item"
            )}
          </Step>
        </div>
        {!data.ready && (
          <Text size="small" className="text-ui-fg-subtle mt-4">
            Until this is done, buyers see "No shipping methods available" at checkout, and products you publish stay as drafts.
          </Text>
        )}
      </Container>

      <HowTo
        id="delivery-setup"
        title="How to set up delivery, step by step"
        steps={[
          <>
            <b>Pickup place.</b> Enter the address where your parcels wait for the courier, with a phone number someone answers. It
            starts with your registered business address; change it if you pack somewhere else.
          </>,
          <>
            <b>Delivery fee.</b> Enter one standard fee for the Philippines. Check what your courier charges for a small parcel and
            start there. Add express only if you can have it delivered in 1–3 days.
          </>,
          <>
            Press <b>Set up delivery</b>. Products you published before this go live by themselves.
          </>,
          <>
            <b>Stock.</b> Open{" "}
            <Link to="/inventory" className="text-ui-fg-interactive hover:underline">
              Inventory
            </Link>{" "}
            and type how many you have of each item. Update it whenever you restock or sell outside Maretinda.
          </>,
        ]}
        note={
          <>
            Have more than one warehouse, or different delivery areas? Add them under{" "}
            <Link to="/settings/locations" className="text-ui-fg-interactive hover:underline">
              Settings → Locations &amp; Shipping
            </Link>
            .
          </>
        }
      />

      <Form key={key} setup={data} />
    </div>
  )
}
