/**
 * A shop can sell once every setup task is done and an admin has approved its
 * documents, the same rule the API enforces (backend lib/seller-readiness).
 * Before that a seller can set up and draft products, but not publish, run
 * promotions or take orders.
 */
export const storeReadiness = (tasks: { complete: boolean }[], verificationStatus?: string | null) => {
  const allDone = tasks.length > 0 && tasks.every((t) => t.complete)
  const approved = verificationStatus === "verified"
  return { canSell: allDone && approved, awaitingApproval: allDone && !approved }
}
