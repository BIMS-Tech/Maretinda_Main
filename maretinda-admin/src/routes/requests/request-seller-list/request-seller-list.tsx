import { useMemo, useState } from "react";

import { Container, Heading, Table, Text, Badge } from "@medusajs/ui";

import { useSellerApplications, type SellerApplication } from "@hooks/api/seller-applications";
import { usesellerRequests } from "@hooks/api/requests";
import type { AdminRequest } from "@custom-types/requests";
import { RequestSellerDetail } from "./components/request-seller-detail";

const PAGE_SIZE = 20;

// Unified row type — either a new full application or a legacy request row
export type NewAppRow = { _source: "new" } & SellerApplication;
export type LegacyRow = { _source: "legacy" } & AdminRequest & {
  _name: string;
  _email: string;
  _normalizedStatus: "pending" | "approved" | "rejected";
  _submittedAt: string;
};
export type UnifiedRow = NewAppRow | LegacyRow;

function normalizeLegacyStatus(s?: string): "pending" | "approved" | "rejected" {
  if (s === "accepted") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

function statusBadge(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return <Badge color="green">Approved</Badge>;
  if (status === "rejected") return <Badge color="red">Rejected</Badge>;
  return <Badge color="orange">Pending</Badge>;
}

function formatDate(d: string | Date | undefined | null) {
  if (!d) return "—";
  return new Date(d as string).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

type StatusFilter = "" | "pending" | "approved" | "rejected";

export const RequestSellerList = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [selected, setSelected] = useState<UnifiedRow | null>(null);

  // New applications (paginated on server)
  const { applications, count: newCount, isLoading: newLoading, refetch: refetchNew } = useSellerApplications({
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    status: statusFilter || undefined,
  });

  // Legacy requests (fetch all — only ~6 exist)
  const { requests: legacyRequests, isLoading: legacyLoading } = usesellerRequests({ type: "seller", limit: 200 }) as any;

  // Normalize legacy rows
  const legacyRows: LegacyRow[] = useMemo(() => {
    if (!Array.isArray(legacyRequests)) return [];
    return legacyRequests.map((req: AdminRequest) => {
      const data = (req.data ?? {}) as any;
      const name = data?.member?.name || data?.seller?.name || "";
      const email = data?.member?.email || data?.seller?.email || data?.provider_identity_id || "";
      return {
        _source: "legacy" as const,
        _name: name,
        _email: email,
        _normalizedStatus: normalizeLegacyStatus(req.status),
        _submittedAt: req.created_at ?? "",
        ...req,
      };
    });
  }, [legacyRequests]);

  // Filter legacy rows by status (since they're client-side)
  const filteredLegacy = useMemo(() => {
    if (!statusFilter) return legacyRows;
    return legacyRows.filter((r) => r._normalizedStatus === statusFilter);
  }, [legacyRows, statusFilter]);

  // New rows wrapped with source tag
  const newRows: NewAppRow[] = useMemo(
    () => applications.map((a: SellerApplication) => ({ _source: "new" as const, ...a })),
    [applications]
  );

  // A registration creates BOTH a Mercur request (legacy) and a new application
  // with the same email. De-duplicate: hide the legacy row when a new
  // application exists for that email. The request is kept (indexed by email) so
  // the application's Approve can also activate the seller via the request.
  const newEmails = useMemo(
    () => new Set(newRows.map((a) => (a.email || "").trim().toLowerCase()).filter(Boolean)),
    [newRows]
  );
  const legacyByEmail = useMemo(() => {
    const m = new Map<string, LegacyRow>();
    for (const r of legacyRows) {
      const e = (r._email || "").trim().toLowerCase();
      if (e && !m.has(e)) m.set(e, r);
    }
    return m;
  }, [legacyRows]);
  const dedupedLegacy = useMemo(
    () => filteredLegacy.filter((r) => !newEmails.has((r._email || "").trim().toLowerCase())),
    [filteredLegacy, newEmails]
  );

  // On page 0, show legacy rows first (they're few). On subsequent pages, new apps only.
  const displayRows: UnifiedRow[] = useMemo(() => {
    if (currentPage === 0) return [...dedupedLegacy, ...newRows];
    return newRows;
  }, [currentPage, dedupedLegacy, newRows]);

  const totalCount = newCount + dedupedLegacy.length;

  const matchedRequest =
    selected && selected._source === "new"
      ? legacyByEmail.get((selected.email || "").trim().toLowerCase()) ?? null
      : null;
  const isLoading = newLoading || legacyLoading;

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
        row={selected}
        matchedRequest={matchedRequest}
        open={!!selected}
        close={() => { setSelected(null); refetchNew(); }}
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
            {displayRows.map((row) => {
              const isNew = row._source === "new";
              const name = isNew ? `${row.first_name} ${row.last_name}` : (row as LegacyRow)._name;
              const email = isNew ? row.email : (row as LegacyRow)._email;
              const business = isNew ? row.business_name : "—";
              const org = isNew ? (row.form_of_organization || "—") : "—";
              const submitted = isNew ? row.submitted_at : (row as LegacyRow)._submittedAt;
              const status = isNew ? (row.status as "pending" | "approved" | "rejected") : (row as LegacyRow)._normalizedStatus;

              return (
                <Table.Row
                  key={row.id}
                  className="cursor-pointer hover:bg-ui-bg-subtle"
                  onClick={() => setSelected(row)}
                >
                  <Table.Cell className="font-medium">
                    {name}
                    {!isNew && (
                      <span className="ml-1.5 text-[10px] text-ui-fg-muted border border-ui-border-base rounded px-1 py-0.5">legacy</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>{email}</Table.Cell>
                  <Table.Cell>{business}</Table.Cell>
                  <Table.Cell>{org}</Table.Cell>
                  <Table.Cell>{formatDate(submitted)}</Table.Cell>
                  <Table.Cell>{statusBadge(status)}</Table.Cell>
                  <Table.Cell>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(row); }}
                      className="text-xs text-ui-fg-interactive hover:underline font-medium"
                    >
                      Review
                    </button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {!isLoading && displayRows.length === 0 && (
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
          canNextPage={PAGE_SIZE * (currentPage + 1) < totalCount}
          canPreviousPage={currentPage > 0}
          previousPage={() => setCurrentPage((p) => p - 1)}
          nextPage={() => setCurrentPage((p) => p + 1)}
          count={totalCount}
          pageCount={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
          pageIndex={currentPage}
          pageSize={PAGE_SIZE}
        />
      </div>
    </Container>
  );
};
