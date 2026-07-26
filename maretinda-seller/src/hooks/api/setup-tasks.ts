import { useMemo } from "react"

import { requiredDocsFor } from "../../lib/business-documents"
import { getSettlementInfo } from "../../lib/settlement"
import { Storeseller } from "../../types/user"
import { useMe } from "./users"

export type SetupTaskKey =
  | "store_profile"
  | "business_address"
  | "bank_details"
  | "verification"

/** One field or document the seller has to supply. */
export type SetupRequirement = {
  label: string
  complete: boolean
}

export type SetupTask = {
  key: SetupTaskKey
  label: string
  description: string
  /** Where the seller goes to finish it. */
  to: string
  requirements: SetupRequirement[]
  complete: boolean
  /** Waiting on admin — done from the seller's side, so it isn't counted as pending. */
  awaitingReview?: boolean
  /** Share of this task's requirements that are satisfied, 0–100. */
  progress: number
  completedCount: number
  totalCount: number
}

export type SetupProgress = {
  /** Overall completion across every requirement, 0–100. */
  percent: number
  completedCount: number
  totalCount: number
}

const hasValue = (value?: string | null) => !!(value && String(value).trim())

const needs = (label: string, value?: string | null): SetupRequirement => ({
  label,
  complete: hasValue(value),
})

const toPercent = (completed: number, total: number) =>
  total === 0 ? 100 : Math.round((completed / total) * 100)

/**
 * Requirements are tracked field-by-field rather than task-by-task so the
 * progress bar moves as the seller fills the forms in, instead of jumping in
 * quarters when a whole section flips to done.
 */
const buildRequirements = (
  seller: Storeseller
): Record<SetupTaskKey, SetupRequirement[]> => {
  const settlement = getSettlementInfo(seller)
  const documents = seller.business_documents || {}
  const requiredDocs = requiredDocsFor(seller.form_of_organization)

  return {
    store_profile: [
      needs("Store name", seller.name),
      needs("Contact email", seller.email),
      needs("Phone number", seller.phone),
      needs("Store description", seller.description),
    ],
    business_address: [
      needs("Address", seller.address_line),
      needs("City", seller.city),
      needs("Postal code", seller.postal_code),
      needs("Country", seller.country_code),
    ],
    bank_details: [
      needs("Bank name", settlement.bankName),
      needs("Account number", settlement.accountNumber),
      needs("Account name", settlement.accountName),
      needs("Branch name", settlement.branchName),
      // Metrobank settles via TAMA and needs none of the transfer block, so
      // those fields aren't counted against a Metrobank seller's progress.
      ...(settlement.isMetrobank
        ? []
        : [
            needs("SWIFT code", settlement.swiftCode),
            needs("Beneficiary address", settlement.beneficiaryAddress),
            needs("Bank address", settlement.beneficiaryBankAddress),
          ]),
    ],
    // Mirrors the verification form exactly (TIN, org type, documents) so the
    // bar on that screen and the one in the checklist track the same thing.
    verification: [
      needs("Business TIN", seller.tax_id),
      needs("Form of organization", seller.form_of_organization),
      ...(requiredDocs.length
        ? requiredDocs.map((doc) => needs(doc.label, documents[doc.key]))
        : // Org type not chosen yet, so the document list is still unknown.
          [{ label: "Required documents", complete: false }]),
    ],
  }
}

/**
 * Everything a seller must supply before the store can trade: profile, company
 * address, settlement bank, and the legal documents admins review.
 */
export const buildSetupTasks = (seller: Storeseller): SetupTask[] => {
  const requirements = buildRequirements(seller)
  const verificationStatus = seller.verification_status || "unverified"
  const awaitingReview = verificationStatus === "pending_review"
  const isRejected = verificationStatus === "rejected"

  const withProgress = (
    task: Omit<
      SetupTask,
      "progress" | "completedCount" | "totalCount" | "requirements" | "complete"
    > & { complete?: boolean }
  ): SetupTask => {
    const items = requirements[task.key]
    const completedCount = items.filter((item) => item.complete).length

    return {
      ...task,
      requirements: items,
      completedCount,
      totalCount: items.length,
      progress: toPercent(completedCount, items.length),
      complete: task.complete ?? completedCount === items.length,
    }
  }

  return [
    withProgress({
      key: "store_profile",
      label: "Store information",
      description: "Store name, contact email, phone and description.",
      to: "/settings/store/edit",
    }),
    withProgress({
      key: "business_address",
      label: "Business address",
      description: "Your registered business address.",
      to: "/settings/store/edit-company",
    }),
    withProgress({
      key: "bank_details",
      label: "Settlement bank details",
      description: "Where your payouts are deposited.",
      to: "/settings/store/edit",
    }),
    withProgress({
      key: "verification",
      label: "Legal documents",
      description: awaitingReview
        ? "Submitted — awaiting admin approval."
        : isRejected
          ? "Verification was rejected. Update your documents and resubmit."
          : "Upload the documents your organization type requires.",
      to: "/settings/store/verification",
      awaitingReview,
      // Admin approval, not the upload, is the last word here — a rejected
      // seller has work to do even with every document on file.
      complete: isRejected
        ? false
        : verificationStatus === "verified" ||
          requirements.verification.every((item) => item.complete),
    }),
  ]
}

/**
 * Verification progress for a seller shape that may not be saved yet — lets the
 * verification form show the bar advancing as documents are attached.
 */
export const getVerificationProgress = (
  seller: Pick<
    Storeseller,
    "tax_id" | "form_of_organization" | "business_documents"
  >
): SetupProgress => {
  const items = buildRequirements(seller).verification
  const completedCount = items.filter((item) => item.complete).length

  return {
    completedCount,
    totalCount: items.length,
    percent: toPercent(completedCount, items.length),
  }
}

export const getSetupProgress = (tasks: SetupTask[]): SetupProgress => {
  const totalCount = tasks.reduce((sum, task) => sum + task.totalCount, 0)
  const completedCount = tasks.reduce(
    (sum, task) => sum + task.completedCount,
    0
  )

  return {
    completedCount,
    totalCount,
    percent: toPercent(completedCount, totalCount),
  }
}

export const useSetupTasks = () => {
  const { seller, isPending, isError } = useMe()

  const tasks = useMemo(
    () => (seller ? buildSetupTasks(seller) : []),
    [seller]
  )

  const pending = tasks.filter((task) => !task.complete)
  const progress = useMemo(() => getSetupProgress(tasks), [tasks])

  return {
    tasks,
    pending,
    progress,
    /** Drives the red count badges. 0 once every task is done or under review. */
    pendingCount: isPending || isError ? 0 : pending.length,
    isPending,
  }
}
