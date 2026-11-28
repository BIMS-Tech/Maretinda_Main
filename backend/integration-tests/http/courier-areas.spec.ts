import crypto from "crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { applyCustomMigrations, bearer, createSeller, givePlan, noThrow, pgOf } from "../helpers"
import { clearFlyingTigersAreaCache } from "../../src/services/flyingtigers"

jest.setTimeout(300 * 1000)

// Real rows from Flying Tigers' public coverage lists
const PROVINCES = [
  { id: 2, provinceCode: "0702200000", provinceLabel: "Cebu", isIntraCityEnabled: true },
  { id: 5, provinceCode: "130000000", provinceLabel: "Metro Manila", isIntraCityEnabled: true },
]
const city = (cityCode: string, cityLabel: string, provinceCode: string) => ({
  id: 1, cityCode, cityLabel, cityMunicipalityCode: cityCode, cityMunicipalityLabel: cityLabel, provinceCode,
})
const LISTS: Record<string, unknown[]> = {
  "/api/addresses/covered-provinces": PROVINCES,
  "/api/addresses/covered-cities-municipalities/130000000": [
    city("1380602000", "Binondo", "130000000"),
    city("1380300000", "Makati City", "130000000"),
    city("1381300000", "Quezon City", "130000000"),
  ],
  "/api/addresses/covered-cities-municipalities/0702200000": [city("0730600000", "Cebu City", "0702200000")],
  "/api/addresses/barangays/1380300000": [
    { barangayCode: "1380300002", barangayLabel: "Bel-Air" },
    { barangayCode: "1380300027", barangayLabel: "Poblacion" },
  ],
  "/api/addresses/barangays/1380602000": [{ barangayCode: "1380602002", barangayLabel: "Barangay 288" }],
  "/api/addresses/barangays/0730600000": [{ barangayCode: "0730600001", barangayLabel: "Apas" }],
}

/**
 * Booking a courier: the booking form offers each carrier's own provinces,
 * cities and barangays, and a booking to a place the carrier can't take is
 * refused with what to choose, before Flying Tigers is called.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    let booked: any[]
    beforeEach(() => {
      clearFlyingTigersAreaCache()
      booked = []
      jest.spyOn(global, "fetch").mockImplementation(async (url: any, init?: any) => {
        const path = new URL(String(url)).pathname
        if (path === "/api/shipments" && init?.method === "POST") {
          booked.push(JSON.parse(init.body))
          return new Response(JSON.stringify({ id: 91, trackingNumber: "TEST-ABC1", status: "Order placed" }), { status: 201 })
        }
        if (path in LISTS) return new Response(JSON.stringify(LISTS[path]), { status: 200 })
        return new Response(JSON.stringify({ message: `not stubbed: ${path}` }), { status: 404 })
      })
    })
    afterEach(() => jest.restoreAllMocks())

    const carrier = (provider_id: string, name: string) =>
      pgOf(getContainer())("platform_shipping_provider").insert({
        id: `psp_${crypto.randomBytes(6).toString("hex")}`,
        provider_id,
        name,
        is_active: true,
        credentials: JSON.stringify({ api_key: "fte_test_key", api_secret: "fte_test_secret" }),
        settings: JSON.stringify({}),
      })

    async function seller() {
      const s = await createSeller(getContainer(), { handle: `ship-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })
      await givePlan(getContainer(), s.seller.id)
      return { headers: bearer(s.token), ...noThrow }
    }

    const address = (over: Record<string, unknown>) => ({
      name: "Juan Cruz",
      phone: "0917 123 4567",
      address: "1 Rizal St",
      postcode: "1200",
      country: "PH",
      ...over,
    })
    const book = async (as: any, from: Record<string, unknown>, to: Record<string, unknown>) =>
      api.post(
        "/vendor/shipping-orders",
        {
          action: "create-order",
          providerId: "flyingtigers",
          orderData: { service_level: "Standard", from: address(from), to: address(to), parcel: { weight: 1, description: "Shirt" } },
        },
        as
      )

    describe("the carrier's areas", () => {
      it("lists Flying Tigers' provinces, cities and barangays by their codes", async () => {
        await carrier("flyingtigers", "Flying Tigers Express")
        const as = await seller()
        const base = "/vendor/shipping-providers/flyingtigers/areas"

        const top = await api.get(base, as)
        expect(top.status).toBe(200)
        expect(top.data).toEqual({
          restricted: true,
          provinces: [
            { code: "0702200000", label: "Cebu" },
            { code: "130000000", label: "Metro Manila" },
          ],
        })
        expect((await api.get(`${base}?province_code=130000000`, as)).data.cities).toContainEqual({ code: "1380300000", label: "Makati City" })
        expect((await api.get(`${base}?city_code=1380300000`, as)).data.barangays).toContainEqual({ code: "1380300002", label: "Bel-Air" })
      })

      it("matches an order's typed address to Flying Tigers' places", async () => {
        await carrier("flyingtigers", "Flying Tigers Express")
        const as = await seller()
        const match = async (q: Record<string, string>) =>
          (await api.get(`/vendor/shipping-providers/flyingtigers/areas?${new URLSearchParams({ match: "1", ...q })}`, as)).data.match

        expect(await match({ province: "NCR", city: "City of Makati", barangay: "Bel Air" })).toEqual({
          province: { code: "130000000", label: "Metro Manila" },
          city: { code: "1380300000", label: "Makati City" },
          barangay: { code: "1380300002", label: "Bel-Air" },
        })
        // Manila is booked by district, found by the barangay
        expect((await match({ province: "Metro Manila", city: "Manila City", barangay: "Brgy. 288" })).city).toEqual({
          code: "1380602000",
          label: "Binondo",
        })
        expect(await match({ province: "Metro Manila", city: "Metro Manila", barangay: "" })).toMatchObject({ city: null })
        expect(await match({ province: "Pampanga", city: "Angeles City", barangay: "" })).toEqual({ province: null, city: null, barangay: null })
      })

      it("tells the form to use the full list for a carrier without one", async () => {
        await carrier("ninjavan", "Ninja Van")
        const res = await api.get("/vendor/shipping-providers/ninjavan/areas", await seller())
        expect(res.data).toEqual({ restricted: false })
      })

      it("refuses a carrier that isn't active", async () => {
        expect((await api.get("/vendor/shipping-providers/flyingtigers/areas", await seller())).status).toBe(404)
      })
    })

    describe("booking Flying Tigers", () => {
      it("refuses a city that is only the province, before calling Flying Tigers", async () => {
        await carrier("flyingtigers", "Flying Tigers Express")
        const res = await book(
          await seller(),
          { city: "Cebu City", state: "Cebu" },
          { city: "Metro Manila", state: "Metro Manila" }
        )
        expect(res.status).toBe(400)
        expect(res.data).toMatchObject({
          code: "courier_city_not_covered",
          side: "to",
          message: "Choose the recipient's city in Metro Manila: Flying Tigers needs the city, not only the province.",
        })
        expect(booked).toHaveLength(0)
      })

      it("sends Flying Tigers its own codes for typed places", async () => {
        await carrier("flyingtigers", "Flying Tigers Express")
        const res = await book(
          await seller(),
          { city: "Cebu City", state: "Cebu", barangay: "Apas" },
          { city: "City of Makati", state: "NCR", barangay: "Bel Air" }
        )
        expect(res.status).toBe(200)
        expect(booked).toHaveLength(1)
        expect(booked[0].senderAddress).toMatchObject({
          provinceCode: "0702200000",
          provinceLabel: "Cebu",
          cityCode: "0730600000",
          cityLabel: "Cebu City",
          barangayCode: "0730600001",
          barangayLabel: "Apas",
        })
        expect(booked[0].receiverAddress).toMatchObject({
          provinceCode: "130000000",
          cityCode: "1380300000",
          cityLabel: "Makati City",
          barangayCode: "1380300002",
          barangayLabel: "Bel-Air",
        })
      })

      it("books the city and barangay chosen from the lists, and leaves out an unknown barangay", async () => {
        await carrier("flyingtigers", "Flying Tigers Express")
        const res = await book(
          await seller(),
          { city: "Cebu City", state: "Cebu", barangay: "Somewhere" },
          { city: "Binondo", state: "Metro Manila", provinceCode: "130000000", cityCode: "1380602000", barangayCode: "1380602002", barangayLabel: "Barangay 288" }
        )
        expect(res.status).toBe(200)
        expect(booked[0].receiverAddress).toMatchObject({ cityCode: "1380602000", cityLabel: "Binondo", barangayCode: "1380602002" })
        expect(booked[0].senderAddress.barangayCode).toBeUndefined()
        expect(booked[0].senderAddress.barangayLabel).toBeUndefined()
      })

      it("refuses a city code that isn't in the province", async () => {
        await carrier("flyingtigers", "Flying Tigers Express")
        const res = await book(
          await seller(),
          { city: "Cebu City", state: "Cebu" },
          { city: "Cebu City", state: "Metro Manila", cityCode: "0730600000" }
        )
        expect(res.status).toBe(400)
        expect(res.data.code).toBe("courier_city_not_covered")
        expect(booked).toHaveLength(0)
      })
    })
  },
})
