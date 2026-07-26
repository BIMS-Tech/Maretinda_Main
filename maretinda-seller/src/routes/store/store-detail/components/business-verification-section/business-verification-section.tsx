import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { CheckCircleSolid, XCircleSolid, Pencil } from "@medusajs/icons"
import { Storeseller } from "../../../../../types/user"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { CompletionBar } from "../../../../../components/common/completion-bar"
import { requiredDocsFor, isVerificationComplete } from "../../../../../lib/business-documents"
import { buildSetupTasks } from "../../../../../hooks/api/setup-tasks"

const STATUS_META: Record<string, { label: string; color: "green" | "orange" | "red" | "grey" }> = {
  verified: { label: "Verified", color: "green" },
  pending_review: { label: "Pending review", color: "orange" },
  rejected: { label: "Rejected", color: "red" },
  unverified: { label: "Not verified", color: "grey" },
}

export const BusinessVerificationSection = ({ seller }: { seller: Storeseller }) => {
  const status = seller.verification_status || "unverified"
  const meta = STATUS_META[status] || STATUS_META.unverified
  const docs = seller.business_documents || {}
  const required = requiredDocsFor(seller.form_of_organization)
  const complete = isVerificationComplete(seller)

  // Same requirement set the sidebar and dashboard checklist count, so the
  // percentages an admin and a seller see can't disagree.
  const verificationTask = buildSetupTasks(seller).find(
    (task) => task.key === "verification"
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <Heading>Business Verification</Heading>
            <Badge color={meta.color} size="2xsmall">
              {meta.label}
            </Badge>
          </div>
          <Text size="small" className="text-ui-fg-subtle text-pretty">
            Add your business TIN and documents to earn a Verified badge on your storefront.
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Pencil />,
                  label: seller.tax_id ? "Edit" : "Complete verification",
                  to: "verification",
                },
              ],
            },
          ]}
        />
      </div>

      {/* Completion progress */}
      {verificationTask && status !== "verified" && (
        <div className="flex flex-col gap-y-2 px-6 py-4">
          <div className="flex items-center justify-between">
            <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
              Verification details completed
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {verificationTask.progress}% ({verificationTask.completedCount} of{" "}
              {verificationTask.totalCount})
            </Text>
          </div>
          <CompletionBar percent={verificationTask.progress} />
        </div>
      )}

      {/* Status hint */}
      {status === "verified" ? (
        <div className="px-6 py-3 bg-ui-bg-subtle">
          <Text size="small" className="text-ui-fg-subtle">
            Your business is verified. Buyers see a Verified badge on your store.
          </Text>
        </div>
      ) : status === "pending_review" ? (
        <div className="px-6 py-3 bg-ui-bg-subtle">
          <Text size="small" className="text-ui-fg-subtle">
            Your documents are submitted and awaiting review by our team.
          </Text>
        </div>
      ) : status === "rejected" ? (
        <div className="px-6 py-3 bg-ui-bg-subtle">
          <Text size="small" className="text-ui-fg-error">
            Verification was rejected{seller.verification_notes ? `: ${seller.verification_notes}` : ""}. Please update your documents and resubmit.
          </Text>
        </div>
      ) : (
        <div className="px-6 py-3 bg-ui-bg-subtle">
          <Text size="small" className="text-ui-fg-subtle">
            {complete
              ? "All set — submit for review from the edit screen."
              : "Complete your TIN and required documents to request verification."}
          </Text>
        </div>
      )}

      {/* TIN */}
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Business TIN
        </Text>
        <Text size="small" leading="compact">
          {seller.tax_id || "-"}
        </Text>
      </div>

      {/* Organization type */}
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Form of Organization
        </Text>
        <Text size="small" leading="compact">
          {seller.form_of_organization || "-"}
        </Text>
      </div>

      {/* Documents checklist */}
      <div className="px-6 py-4">
        <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle mb-3">
          Documents
        </Text>
        {required.length === 0 ? (
          <Text size="small" className="text-ui-fg-muted">
            Set your form of organization to see the required documents.
          </Text>
        ) : (
          <ul className="flex flex-col gap-2">
            {required.map((doc) => {
              const uploaded = !!(docs[doc.key] && String(docs[doc.key]).trim())
              return (
                <li key={doc.key} className="flex items-center gap-2">
                  {uploaded ? (
                    <CheckCircleSolid className="text-ui-fg-interactive" />
                  ) : (
                    <XCircleSolid className="text-ui-fg-muted" />
                  )}
                  <Text size="small" className={uploaded ? "text-ui-fg-base" : "text-ui-fg-muted"}>
                    {doc.label}
                  </Text>
                  {uploaded && (
                    <a
                      href={docs[doc.key]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ui-fg-interactive text-xs underline ml-1"
                    >
                      View
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Container>
  )
}
