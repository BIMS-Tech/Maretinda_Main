import { Input, Label, Text } from "@medusajs/ui"
import { ReactNode, useEffect } from "react"

import { matchCarrierArea, useCarrierBarangays, useCarrierCities, useCarrierProvinces } from "../../../hooks/api/shipping"
import phLocations from "../../../lib/ph-locations.json"

const CITIES = phLocations as Record<string, string[]>
const PROVINCES = Object.keys(CITIES)

/** Province, city and barangay of a booking address, with the chosen carrier's codes for them. */
export type AddressArea = {
  province: string
  city: string
  barangay: string
  provinceCode?: string
  cityCode?: string
  barangayCode?: string
  /** What the order or pickup address said, to explain anything not on the carrier's list */
  typed?: { province: string; city: string; barangay: string }
  /** The carrier these were matched for; another carrier matches them again */
  matchedFor?: string
}

/** An address as typed on the order or the pickup location, before matching. */
export const typedArea = (province?: string | null, city?: string | null, barangay?: string | null): AddressArea => {
  const typed = { province: province?.trim() ?? "", city: city?.trim() ?? "", barangay: barangay?.trim() ?? "" }
  return { ...typed, typed }
}

// "City of Makati" and "Makati City", "NCR" and "Metro Manila", "Parañaque" and "Paranaque"
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,()]/g, " ")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
const placeKey = (s: string) => fold(s).replace(/^(city|municipality|province) of /, "").replace(/ city$/, "")
const PROVINCE_ALIASES: Record<string, string> = { ncr: "metro manila", "national capital region": "metro manila" }
const provinceKey = (s: string) => PROVINCE_ALIASES[placeKey(s)] ?? placeKey(s)
const fromList = (list: string[], typed: string, key = placeKey) =>
  typed.trim() ? list.find((x) => key(x) === key(typed)) ?? "" : ""

const SELECT =
  "bg-ui-bg-field border-ui-border-base text-ui-fg-base h-8 w-full rounded-md border px-2 text-sm disabled:opacity-60"

const Field = ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <Label className="text-ui-fg-base text-sm font-medium">
      {label}
      {required && <span className="text-ui-fg-error ml-0.5">*</span>}
    </Label>
    {children}
  </div>
)

/**
 * Province → city → barangay for a booking address, from the chosen carrier.
 * A carrier with its own list (Flying Tigers) offers only the places it books
 * to, by its codes; any other carrier gets the full Philippine list. Switching
 * carrier matches the address to the new one's list again.
 */
export function AddressAreaFields({
  providerId,
  carrierName,
  who,
  value,
  onChange,
}: {
  providerId: string
  carrierName: string
  who: "sender" | "recipient"
  value: AddressArea
  onChange: (next: AddressArea) => void
}) {
  const areas = useCarrierProvinces(providerId || undefined)
  const restricted = areas.data?.restricted === true
  const provinces = areas.data?.provinces ?? []
  const cities = useCarrierCities(restricted ? providerId : undefined, value.provinceCode)
  const barangays = useCarrierBarangays(restricted ? providerId : undefined, value.cityCode)
  const source = who === "sender" ? "pickup address" : "order"
  const Who = who === "sender" ? "Sender" : "Recipient"

  // Match the address to this carrier's places, once per carrier
  useEffect(() => {
    if (!providerId || value.matchedFor === providerId || !(areas.data || areas.isError)) return
    const typed = {
      province: value.province || value.typed?.province || "",
      city: value.city || value.typed?.city || "",
      barangay: value.barangay || value.typed?.barangay || "",
    }
    const done = { provinceCode: undefined, cityCode: undefined, barangayCode: undefined, matchedFor: providerId }
    // Nothing typed yet: nothing to look up
    if (!typed.province && !typed.city && !typed.barangay) {
      onChange({ ...value, ...done })
      return
    }
    if (!restricted) {
      const province = fromList(PROVINCES, typed.province, provinceKey) || typed.province
      const city = fromList(CITIES[province] ?? [], typed.city) || typed.city
      onChange({ ...value, ...done, province, city, barangay: typed.barangay })
      return
    }
    let gone = false
    matchCarrierArea(providerId, typed)
      .then((m) => {
        if (gone) return
        onChange({
          ...value,
          ...done,
          province: m.province?.label ?? typed.province,
          provinceCode: m.province?.code,
          city: m.city?.label ?? "",
          cityCode: m.city?.code,
          barangay: m.barangay?.label ?? "",
          barangayCode: m.barangay?.code,
          typed: value.typed ?? typed,
        })
      })
      .catch(() => !gone && onChange({ ...value, matchedFor: providerId }))
    return () => {
      gone = true
    }
    // value.typed is new for each order or pickup address filled in, which cancels a lookup still running for the last one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, value.matchedFor, value.typed, areas.data, areas.isError])

  if (areas.isLoading) {
    return <Text size="xsmall" className="text-ui-fg-muted">Loading where {carrierName} delivers…</Text>
  }

  if (!restricted) {
    const provinceOptions = value.province && !PROVINCES.includes(value.province) ? [value.province, ...PROVINCES] : PROVINCES
    const cityList = CITIES[value.province] ?? []
    const cityOptions = value.city && !cityList.includes(value.city) ? [value.city, ...cityList] : cityList
    return (
      <div className="flex flex-col gap-2">
        {areas.isError && (
          <Text size="xsmall" className="text-ui-fg-muted">
            Couldn't load {carrierName}'s delivery areas, so the full list is shown. The booking still checks them.
          </Text>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Province" required>
            <select
              aria-label={`${Who} province`}
              className={SELECT}
              value={value.province}
              onChange={(e) => onChange({ ...value, province: e.target.value, city: "", matchedFor: providerId })}
            >
              <option value="">Choose a province</option>
              {provinceOptions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="City / municipality" required>
            <select
              aria-label={`${Who} city`}
              className={SELECT}
              value={value.city}
              disabled={!value.province}
              onChange={(e) => onChange({ ...value, city: e.target.value, matchedFor: providerId })}
            >
              <option value="">Choose a city</option>
              {cityOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Barangay">
            <Input
              aria-label={`${Who} barangay`}
              size="small"
              value={value.barangay}
              onChange={(e) => onChange({ ...value, barangay: e.target.value, matchedFor: providerId })}
            />
          </Field>
        </div>
      </div>
    )
  }

  const typed = value.typed
  const manila = !!typed?.city && ["manila", "manila city", "city of manila"].includes(fold(typed.city))
  let hint: { text: string; tone: "error" | "warn" | "muted" } | null = null
  if (typed?.province && !value.provinceCode) {
    hint = {
      tone: "error",
      text: `${carrierName} doesn't ${who === "sender" ? "pick up from" : "deliver to"} ${typed.province}. It covers ${provinces.map((p) => p.label).join(", ")}.`,
    }
  } else if (value.provinceCode && !value.cityCode && typed?.city) {
    hint = {
      tone: "warn",
      text: manila
        ? `The ${source} says "${typed.city}". ${carrierName} books Manila by district: choose the district.`
        : `The ${source} says "${typed.city}", which isn't on ${carrierName}'s list. Choose the city.`,
    }
  } else if (value.cityCode && typed?.barangay && !value.barangayCode) {
    hint = {
      tone: "muted",
      text: `Barangay "${typed.barangay}" isn't on ${carrierName}'s list. Choose it if it's there under another name, or leave it out.`,
    }
  }

  return (
    <div className="flex flex-col gap-2" data-testid={`${who}-area`}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Province" required>
          <select
            aria-label={`${Who} province`}
            className={SELECT}
            value={value.provinceCode ?? ""}
            onChange={(e) => {
              const p = provinces.find((x) => x.code === e.target.value)
              onChange({
                ...value,
                province: p?.label ?? "",
                provinceCode: p?.code,
                city: "",
                cityCode: undefined,
                barangay: "",
                barangayCode: undefined,
                matchedFor: providerId,
              })
            }}
          >
            <option value="">Choose a province</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City / municipality" required>
          <select
            aria-label={`${Who} city`}
            className={SELECT}
            value={value.cityCode ?? ""}
            disabled={!value.provinceCode || cities.isLoading}
            onChange={(e) => {
              const c = cities.data?.find((x) => x.code === e.target.value)
              onChange({ ...value, city: c?.label ?? "", cityCode: c?.code, barangay: "", barangayCode: undefined, matchedFor: providerId })
            }}
          >
            <option value="">{cities.isLoading ? "Loading…" : "Choose a city"}</option>
            {cities.data?.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Barangay">
          <select
            aria-label={`${Who} barangay`}
            className={SELECT}
            value={value.barangayCode ?? ""}
            disabled={!value.cityCode || barangays.isLoading}
            onChange={(e) => {
              const b = barangays.data?.find((x) => x.code === e.target.value)
              onChange({ ...value, barangay: b?.label ?? "", barangayCode: b?.code, matchedFor: providerId })
            }}
          >
            <option value="">{barangays.isLoading ? "Loading…" : "Not listed"}</option>
            {barangays.data?.map((b) => (
              <option key={b.code} value={b.code}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {hint && (
        <Text
          size="xsmall"
          role={hint.tone === "error" ? "alert" : undefined}
          className={hint.tone === "error" ? "text-ui-fg-error" : hint.tone === "warn" ? "text-ui-tag-orange-text" : "text-ui-fg-muted"}
        >
          {hint.text}
        </Text>
      )}
    </div>
  )
}
