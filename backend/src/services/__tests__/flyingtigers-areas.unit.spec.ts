import {
  cityNotCoveredMessage,
  clearFlyingTigersAreaCache,
  matchFlyingTigersBarangay,
  matchFlyingTigersCity,
  resolveFlyingTigersArea,
} from "../flyingtigers"

// Real rows from Flying Tigers' covered-cities list for Metro Manila (130000000)
const NCR = { provinceCode: "130000000", provinceLabel: "Metro Manila" }
const city = (cityCode: string, cityLabel: string) => ({ cityCode, cityLabel, provinceCode: NCR.provinceCode })
const CITIES = [
  city("1380602000", "Binondo"),
  city("1380608000", "Ermita"),
  city("1380300000", "Makati City"),
  city("1381000000", "Parañaque City"),
  city("1381300000", "Quezon City"),
  city("1380605000", "Santa Cruz"),
  city("1380601000", "Tondo I/II"),
  city("1381400000", "San Juan City"),
  city("1380607000", "San Miguel"),
  city("1380604000", "San Nicolas"),
]
const MAKATI_BARANGAYS = [
  { barangayCode: "1380300001", barangayLabel: "Bangkal" },
  { barangayCode: "1380300002", barangayLabel: "Bel-Air" },
  { barangayCode: "1380300027", barangayLabel: "Poblacion" },
]
const BINONDO_BARANGAYS = [
  { barangayCode: "1380602001", barangayLabel: "Barangay 287" },
  { barangayCode: "1380602002", barangayLabel: "Barangay 288" },
]
const ERMITA_BARANGAYS = [{ barangayCode: "1380608001", barangayLabel: "Barangay 659" }]

describe("matchFlyingTigersCity", () => {
  it.each([
    ["Makati", "Makati City"],
    ["City of Makati", "Makati City"],
    ["makati city", "Makati City"],
    ["Paranaque", "Parañaque City"],
    ["City of Parañaque", "Parañaque City"],
    ["Quezon City", "Quezon City"],
    ["Tondo", "Tondo I/II"],
    ["Sta. Cruz", "Santa Cruz"],
    ["San Juan", "San Juan City"],
  ])("reads %j as %j", (typed, label) => {
    expect(matchFlyingTigersCity(typed, CITIES)?.cityLabel).toBe(label)
  })

  it.each(["Metro Manila", "Manila", "Manila City", "San", "", undefined, "Pasig"])("doesn't guess %j", (typed) => {
    expect(matchFlyingTigersCity(typed, CITIES)).toBeNull()
  })
})

describe("matchFlyingTigersBarangay", () => {
  it.each([
    ["Bel Air", "Bel-Air"],
    ["bel-air", "Bel-Air"],
    ["Brgy. Poblacion", "Poblacion"],
  ])("reads %j as %j", (typed, label) => {
    expect(matchFlyingTigersBarangay(typed, MAKATI_BARANGAYS)?.barangayLabel).toBe(label)
  })

  it.each(["Brgy. 287", "Barangay 287", "287"])("reads Manila's %j", (typed) => {
    expect(matchFlyingTigersBarangay(typed, BINONDO_BARANGAYS)?.barangayCode).toBe("1380602001")
  })
})

describe("resolveFlyingTigersArea", () => {
  const LISTS: Record<string, unknown[]> = {
    "/api/addresses/covered-cities-municipalities/130000000": CITIES,
    "/api/addresses/barangays/1380300000": MAKATI_BARANGAYS,
    "/api/addresses/barangays/1380602000": BINONDO_BARANGAYS,
    "/api/addresses/barangays/1380608000": ERMITA_BARANGAYS,
  }
  beforeEach(() => {
    clearFlyingTigersAreaCache()
    jest.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const path = new URL(String(url)).pathname
      return new Response(JSON.stringify(LISTS[path] ?? []), { status: 200 })
    })
  })
  afterEach(() => jest.restoreAllMocks())

  it("finds the city and barangay", async () => {
    const area = await resolveFlyingTigersArea(NCR, "City of Makati", "Bel Air")
    expect(area.city?.cityCode).toBe("1380300000")
    expect(area.barangay?.barangayCode).toBe("1380300002")
  })

  it("places a Manila address in its district by its barangay", async () => {
    const area = await resolveFlyingTigersArea(NCR, "Manila City", "Barangay 288")
    expect(area.city?.cityLabel).toBe("Binondo")
    expect(area.barangay?.barangayCode).toBe("1380602002")
  })

  it("needs a city, not only the province", async () => {
    const area = await resolveFlyingTigersArea(NCR, "Metro Manila", "Bel Air")
    expect(area.city).toBeNull()
    expect(area.cities).toHaveLength(CITIES.length)
  })

  it("leaves out a barangay Flying Tigers doesn't list", async () => {
    const area = await resolveFlyingTigersArea(NCR, "Makati", "Nowhere")
    expect(area.city?.cityLabel).toBe("Makati City")
    expect(area.barangay).toBeNull()
  })
})

describe("cityNotCoveredMessage", () => {
  it("asks for the city when only the province was given", () => {
    expect(cityNotCoveredMessage("sender", NCR, "Metro Manila", CITIES)).toBe(
      "Choose the sender's city in Metro Manila: Flying Tigers needs the city, not only the province."
    )
  })
  it("asks for the Manila district", () => {
    expect(cityNotCoveredMessage("recipient", NCR, "Manila", CITIES)).toMatch(/^Choose the recipient's Manila district: .*Binondo, Ermita.*Tondo I\/II/)
  })
  it("lists the covered cities for an uncovered one", () => {
    expect(cityNotCoveredMessage("recipient", NCR, "Pasig", CITIES)).toMatch(/^Flying Tigers doesn't deliver to Pasig, Metro Manila\. Choose the recipient's city from its list: Binondo, /)
  })
})
