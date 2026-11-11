import { CheckCircleSolid, XCircleSolid } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { format } from "date-fns"
import { Link } from "react-router-dom"

import { useSellerStanding } from "@hooks/api/marketplace"

// The four parts of store setup, as the seller panel names them
const SETUP_PARTS = ["store information", "business address", "settlement bank details", "approved legal documents"]

/**
 * Whether this shop can sell right now, and if not, why: the same rules that
 * hide a closed shop from buyers and refuse its items in carts.
 */
export const SellerStandingSection = ({ sellerId }: { sellerId: string }) => {
  const { data, isPending } = useSellerStanding(sellerId)

  if (isPending) return <div className="brand-shimmer mb-2 h-[168px] rounded-xl" />
  if (!data) return null

  const status = data.suspended
    ? { color: "red" as const, label: "Suspended by Maretinda" }
    : data.open
      ? { color: "green" as const, label: "Open to buyers" }
      : { color: "orange" as const, label: "Closed to buyers" }

  return (
    <Container className="mb-2 divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Can this shop sell?</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            A shop sells with a plan and a finished, approved setup. Closed shops are hidden from buyers.
          </Text>
        </div>
        <StatusBadge color={status.color}>{status.label}</StatusBadge>
      </div>
      <div className="grid grid-cols-1 gap-6 px-6 py-4 md:grid-cols-2">
        <div>
          <Text size="small" weight="plus" className="mb-2">Plan</Text>
          {data.plan ? (
            <Text size="small" className="text-ui-fg-subtle">
              {data.plan.name}
              {data.plan.trial ? " (free month)" : ` · ₱${data.plan.price.toLocaleString("en-PH")} ${data.plan.billing_period}`}
              {" · until "}
              {format(new Date(data.plan.ends_at), "MMM d, yyyy")}
            </Text>
          ) : (
            <Text size="small" className="text-ui-tag-orange-text">No plan running</Text>
          )}
          <Link to="/subscriptions" className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover txt-compact-small-plus mt-1 inline-block">
            Manage plans
          </Link>
        </div>
        <div>
          <Text size="small" weight="plus" className="mb-2">Store setup</Text>
          <ul className="flex flex-col gap-1.5">
            {SETUP_PARTS.map((part) => {
              const done = !data.setup.missing.includes(part)
              return (
                <li key={part} className="flex items-center gap-2">
                  {done ? (
                    <CheckCircleSolid className="text-ui-tag-green-icon" />
                  ) : (
                    <XCircleSolid className="text-ui-tag-orange-icon" />
                  )}
                  <Text size="small" className={done ? "text-ui-fg-subtle" : "text-ui-fg-base"}>
                    {part[0].toUpperCase() + part.slice(1)}
                  </Text>
                </li>
              )
            })}
          </ul>
          {data.verification_status === "pending_review" && (
            <Link
              to="/requests/seller-verification"
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover txt-compact-small-plus mt-2 inline-block"
            >
              Review their documents
            </Link>
          )}
        </div>
      </div>
    </Container>
  )
}
