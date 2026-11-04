import {
  REQUIRED_DOCUMENTS,
  deriveStatusAfterSellerUpdate,
  isVerificationComplete,
} from "../seller-verification"

const allDocs = (org: string) =>
  Object.fromEntries(REQUIRED_DOCUMENTS[org].map((key) => [key, `https://files/${key}.pdf`]))

describe("isVerificationComplete", () => {
  it.each(Object.keys(REQUIRED_DOCUMENTS))(
    "accepts a %s with a TIN and every required document",
    (org) => {
      expect(
        isVerificationComplete({ tax_id: "123-456-789", form_of_organization: org, business_documents: allDocs(org) })
      ).toBe(true)
    }
  )

  it.each(Object.keys(REQUIRED_DOCUMENTS))("rejects a %s missing any one required document", (org) => {
    for (const missing of REQUIRED_DOCUMENTS[org]) {
      const docs = allDocs(org)
      delete docs[missing]
      expect(
        isVerificationComplete({ tax_id: "123-456-789", form_of_organization: org, business_documents: docs })
      ).toBe(false)
    }
  })

  it("requires a TIN even when every document is uploaded", () => {
    const docs = allDocs("Corporation")
    expect(isVerificationComplete({ tax_id: "", form_of_organization: "Corporation", business_documents: docs })).toBe(false)
    expect(isVerificationComplete({ tax_id: "   ", form_of_organization: "Corporation", business_documents: docs })).toBe(false)
    expect(isVerificationComplete({ tax_id: null, form_of_organization: "Corporation", business_documents: docs })).toBe(false)
  })

  it("treats blank document URLs as not uploaded", () => {
    const docs = { ...allDocs("Government"), valid_id: "  " }
    expect(isVerificationComplete({ tax_id: "1", form_of_organization: "Government", business_documents: docs })).toBe(false)
  })

  it("accepts documents stored as a JSON string", () => {
    expect(
      isVerificationComplete({
        tax_id: "1",
        form_of_organization: "Government",
        business_documents: JSON.stringify(allDocs("Government")),
      })
    ).toBe(true)
  })

  it("treats malformed JSON documents as none uploaded", () => {
    expect(
      isVerificationComplete({ tax_id: "1", form_of_organization: "Government", business_documents: "{not json" })
    ).toBe(false)
  })

  it("falls back to a TIN plus any one document for an unknown organization type", () => {
    expect(isVerificationComplete({ tax_id: "1", form_of_organization: "Startup", business_documents: { x: "url" } })).toBe(true)
    expect(isVerificationComplete({ tax_id: "1", form_of_organization: "", business_documents: { x: "url" } })).toBe(true)
    expect(isVerificationComplete({ tax_id: "1", form_of_organization: "Startup", business_documents: {} })).toBe(false)
    expect(isVerificationComplete({ tax_id: "1", form_of_organization: null, business_documents: null })).toBe(false)
  })

  it("matches the organization type after trimming whitespace", () => {
    expect(
      isVerificationComplete({ tax_id: "1", form_of_organization: "  Government ", business_documents: allDocs("Government") })
    ).toBe(true)
  })
})

describe("deriveStatusAfterSellerUpdate", () => {
  it("moves an unverified seller to pending review once details are complete", () => {
    expect(deriveStatusAfterSellerUpdate("unverified", true)).toBe("pending_review")
  })

  it("lets a rejected seller resubmit", () => {
    expect(deriveStatusAfterSellerUpdate("rejected", true)).toBe("pending_review")
  })

  it("drops a pending seller back to unverified when details are removed", () => {
    expect(deriveStatusAfterSellerUpdate("pending_review", false)).toBe("unverified")
  })

  it("never un-verifies a verified seller from a seller-side update", () => {
    expect(deriveStatusAfterSellerUpdate("verified", false)).toBe("verified")
    expect(deriveStatusAfterSellerUpdate("verified", true)).toBe("verified")
  })

  it("defaults a missing status to unverified", () => {
    expect(deriveStatusAfterSellerUpdate(null, false)).toBe("unverified")
    expect(deriveStatusAfterSellerUpdate(undefined, true)).toBe("pending_review")
  })
})
