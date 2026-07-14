import { useState } from "react";

import { Container, Heading, Table, Text, Badge } from "@medusajs/ui";

import {
  useSellerVerifications,
  type SellerVerification,
} from "@hooks/api/seller-verifications";
import { SellerVerificationDetail } from "./components/seller-verification-detail";

type StatusFilter = "pending_review" | "verified" | "rejected" | "unverified" | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending_review", label: "Pending review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "unverified", label: "Not verified" },
  { value: "all", label: "All" },
];

function statusBadge(status: string) {
  if (status === "verified") return <Badge color="green">Verified</Badge>;
  if (status === "rejected") return <Badge color="red">Rejected</Badge>;
  if (status === "pending_review") return <Badge color="orange">Pending review</Badge>;
  return <Badge color="grey">Not verified</Badge>;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const SellerVerificationList = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending_review");
  const [selected, setSelected] = useState<SellerVerification | null>(null);

  const { sellers, pendingCount, isLoading, refetch } = useSellerVerifications({
    status: statusFilter,
  });

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Heading>Seller Verifications</Heading>
            {pendingCount > 0 && <Badge color="orange">{pendingCount} pending</Badge>}
          </div>
          <Text className="text-ui-fg-subtle text-sm mt-0.5">
            Review business TIN and documents, then approve to grant the Verified badge.
          </Text>
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                statusFilter === f.value
                  ? "bg-ui-bg-base-pressed border-ui-border-strong text-ui-fg-base"
                  : "border-ui-border-base text-ui-fg-subtle hover:bg-ui-bg-subtle"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <SellerVerificationDetail
        seller={selected}
        open={!!selected}
        close={() => {
          setSelected(null);
          refetch();
        }}
      />

      <div className="flex size-full flex-col overflow-hidden">
        {isLoading && <Text className="px-6 py-4 text-ui-fg-subtle">Loading…</Text>}

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Store</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Organization</Table.HeaderCell>
              <Table.HeaderCell>TIN</Table.HeaderCell>
              <Table.HeaderCell>Submitted</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sellers.map((s: SellerVerification) => (
              <Table.Row
                key={s.id}
                className="cursor-pointer hover:bg-ui-bg-subtle"
                onClick={() => setSelected(s)}
              >
                <Table.Cell className="font-medium">{s.name || "—"}</Table.Cell>
                <Table.Cell>{s.email || "—"}</Table.Cell>
                <Table.Cell>{s.form_of_organization || "—"}</Table.Cell>
                <Table.Cell>{s.tax_id || "—"}</Table.Cell>
                <Table.Cell>{formatDate(s.created_at)}</Table.Cell>
                <Table.Cell>{statusBadge(s.verification_status)}</Table.Cell>
                <Table.Cell>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(s);
                    }}
                    className="text-xs text-ui-fg-interactive hover:underline font-medium"
                  >
                    Review
                  </button>
                </Table.Cell>
              </Table.Row>
            ))}
            {!isLoading && sellers.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <Text className="text-center py-6 text-ui-fg-subtle">No sellers found.</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </Container>
  );
};
