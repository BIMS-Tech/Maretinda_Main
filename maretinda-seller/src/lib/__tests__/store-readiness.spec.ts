import { describe, expect, it } from "vitest"
import { storeReadiness } from "../store-readiness"

const task = (complete: boolean) => ({ complete })

describe("storeReadiness", () => {
  it("can sell once every task is done and the documents are approved", () => {
    expect(storeReadiness([task(true), task(true)], "verified")).toEqual({ canSell: true, awaitingApproval: false })
  })

  it("waits on approval when everything is submitted", () => {
    expect(storeReadiness([task(true), task(true)], "pending_review")).toEqual({ canSell: false, awaitingApproval: true })
  })

  it("can't sell with setup still to do", () => {
    expect(storeReadiness([task(true), task(false)], "verified")).toEqual({ canSell: false, awaitingApproval: false })
  })
})
