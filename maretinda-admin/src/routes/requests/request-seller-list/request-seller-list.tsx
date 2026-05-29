import { useState } from "react";

import { Container, Heading, Table, Text, Badge } from "@medusajs/ui";

import { useSellerApplications, type SellerApplication } from "@hooks/api/seller-applications";
import { RequestSellerDetail } from "./components/request-seller-detail";

const PAGE_SIZE = 20;

function statusBadge(status: string) {
  if (status === "approved") return <Badge color="green">Approved</Badge>;
  if (status === "rejected") return <Badge color="red">Rejected</Badge>;
  return <Badge color="orange">Pending</Badge>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type StatusFilter = "" | "pending" | "approved" | "rejected";

export const RequestSellerList = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [selected, setSelected] = useState<SellerApplication | null>(null);

  const { applications, count, isLoading, refetch } = useSellerApplications({
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    status: statusFilter || undefined,
  });

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-3">
        <div>
          <Heading>Seller Applications</Heading>
          <Text className="text-ui-fg-subtle text-sm mt-0.5">
            Review and manage seller registration applications.
          </Text>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {(["", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(0); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                statusFilter === s
                  ? "bg-ui-bg-base-pressed border-ui-border-strong text-ui-fg-base"
                  : "border-ui-border-base text-ui-fg-subtle hover:bg-ui-bg-subtle"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      <RequestSellerDetail
        application={selected}
        open={!!selected}
        close={() => { setSelected(null); refetch(); }}
      />

      <div className="flex size-full flex-col overflow-hidden">
        {isLoading && <Text className="px-6 py-4 text-ui-fg-subtle">Loading…</Text>}

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Applicant</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Business</Table.HeaderCell>
              <Table.HeaderCell>Organization</Table.HeaderCell>
              <Table.HeaderCell>Submitted</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {applications.map((app) => (
              <Table.Row key={app.id} className="cursor-pointer hover:bg-ui-bg-subtle" onClick={() => setSelected(app)}>
                <Table.Cell className="font-medium">
                  {app.first_name} {app.last_name}
                </Table.Cell>
                <Table.Cell>{app.email}</Table.Cell>
                <Table.Cell>{app.business_name}</Table.Cell>
                <Table.Cell>{app.form_of_organization || "—"}</Table.Cell>
                <Table.Cell>{formatDate(app.submitted_at)}</Table.Cell>
                <Table.Cell>{statusBadge(app.status)}</Table.Cell>
                <Table.Cell>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelected(app); }}
                    className="text-xs text-ui-fg-interactive hover:underline font-medium"
                  >
                    Review
                  </button>
                </Table.Cell>
              </Table.Row>
            ))}
            {!isLoading && applications.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <Text className="text-center py-6 text-ui-fg-subtle">No applications found.</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        <Table.Pagination
          className="w-full"
          canNextPage={PAGE_SIZE * (currentPage + 1) < count}
          canPreviousPage={currentPage > 0}
          previousPage={() => setCurrentPage((p) => p - 1)}
          nextPage={() => setCurrentPage((p) => p + 1)}
          count={count}
          pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
          pageIndex={currentPage}
          pageSize={PAGE_SIZE}
        />
      </div>
    </Container>
  );
};
