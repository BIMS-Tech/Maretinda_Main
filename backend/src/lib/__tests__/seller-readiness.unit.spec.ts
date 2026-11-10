import { sellerReadiness } from "../seller-readiness"

const ready = {
  name: "Shop",
  email: "shop@example.test",
  phone: "+639171234567",
  description: "Barongs",
  address_line: "1 Rizal St",
  city: "Angeles City",
  postal_code: "2009",
  country_code: "ph",
  bank_name: "Metrobank",
  account_number: "1234567890",
  account_name: "Shop Inc",
  branch_name: "Angeles",
  verification_status: "verified",
}

describe("sellerReadiness", () => {
  it("is ready with a full profile, address, bank details and approved documents", () => {
    expect(sellerReadiness(ready)).toEqual({ ready: true, missing: [] })
  })

  it("names each unfinished part of the setup", () => {
    const result = sellerReadiness({ ...ready, description: "", city: null, account_number: "" })
    expect(result.ready).toBe(false)
    expect(result.missing).toEqual(["store information", "business address", "settlement bank details"])
  })

  it("waits for an admin to approve the documents", () => {
    expect(sellerReadiness({ ...ready, verification_status: "pending_review" }).missing).toEqual(["approved legal documents"])
    expect(sellerReadiness({ ...ready, verification_status: "rejected" }).ready).toBe(false)
  })

  it("asks a non-Metrobank account for the transfer details too", () => {
    const other = { ...ready, bank_name: "BPI" }
    expect(sellerReadiness(other).missing).toEqual(["settlement bank details"])
    expect(
      sellerReadiness({ ...other, swift_code: "BOPIPHMM", beneficiary_address: "1 Rizal St", beneficiary_bank_address: "Angeles" }).ready
    ).toBe(true)
  })

  it("accepts the older DFT bank columns", () => {
    const legacy = { ...ready, bank_name: null, account_number: null, account_name: null, dft_bank_name: "Metrobank", dft_account_number: "1", dft_beneficiary_name: "Shop" }
    expect(sellerReadiness(legacy).ready).toBe(true)
  })
})
