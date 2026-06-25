import { useState } from "react";
import { Badge, Button, Drawer, Heading, Text, Textarea } from "@medusajs/ui";
import { ArrowDownTray } from "@medusajs/icons";

import {
  useUpdateSellerApplication,
  type SellerApplication,
} from "@hooks/api/seller-applications";
import { useReviewRequest } from "@hooks/api/requests";
import type { NewAppRow, LegacyRow, UnifiedRow } from "../request-seller-list";

type Props = {
  row: UnifiedRow | null;
  open: boolean;
  close: () => void;
  // The legacy Mercur seller request that belongs to the same registration as a
  // new application (matched by email). Approving the application also accepts
  // this request, which is what actually activates the seller account.
  matchedRequest?: LegacyRow | null;
};

function statusBadge(status: string) {
  if (status === "approved" || status === "accepted") return <Badge color="green">Approved</Badge>;
  if (status === "rejected") return <Badge color="red">Rejected</Badge>;
  return <Badge color="orange">Pending</Badge>;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text className="text-xs text-ui-fg-muted font-medium uppercase tracking-wide">{label}</Text>
      <Text className="text-sm text-ui-fg-base">{value || "—"}</Text>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-ui-border-base rounded-xl p-4 flex flex-col gap-3">
      <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted">{title}</Text>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

// ─── Full new-application drawer ─────────────────────────────────────────────

function NewAppDrawer({ row, matchedRequest, close }: { row: NewAppRow; matchedRequest?: LegacyRow | null; close: () => void }) {
  const [adminNotes, setAdminNotes] = useState("");
  const [actionError, setActionError] = useState("");

  const app: SellerApplication = row;

  // Approving/rejecting the application also reviews the linked Mercur seller
  // request — that is what creates/activates (or rejects) the seller account.
  const reviewMutation = useReviewRequest({
    onError: (err: Error) => setActionError(err.message || "Failed to update the seller account"),
  });

  const updateMutation = useUpdateSellerApplication(app.id, {
    onSuccess: () => close(),
    onError: (err) => setActionError(err.message || "Action failed"),
  });

  const docs = typeof app.documents === "string"
    ? JSON.parse(app.documents)
    : (app.documents ?? {});

  const handleAction = (status: "approved" | "rejected") => {
    setActionError("");
    if (matchedRequest?.id && matchedRequest._normalizedStatus === "pending") {
      reviewMutation.mutate({
        id: matchedRequest.id,
        payload: {
          status: status === "approved" ? "accepted" : "rejected",
          reviewer_note: adminNotes || undefined,
        },
      });
    }
    updateMutation.mutate({ status, admin_notes: adminNotes || undefined });
  };

  const handleDownload = () => {
    const exportData = {
      application_id: app.id,
      submitted_at: app.submitted_at,
      status: app.status,
      merchant: {
        first_name: app.first_name,
        last_name: app.last_name,
        email: app.email,
        mobile_number: app.mobile_number,
        complete_address: app.complete_address,
        designation: app.designation,
        target_go_live: app.target_go_live,
      },
      business: {
        business_name: app.business_name,
        business_address: app.business_address,
        business_landline: app.business_landline,
        business_mobile: app.business_mobile,
        business_email: app.business_email,
        business_tin: app.business_tin,
        form_of_organization: app.form_of_organization,
        merchant_category: app.merchant_category,
        business_activity: app.business_activity,
      },
      authorized_signatory: app.signatory_first_name
        ? {
            name: `${app.signatory_first_name} ${app.signatory_middle_name ?? ""} ${app.signatory_last_name}`.trim(),
            email: app.signatory_email,
            landline: app.signatory_landline,
            mobile: app.signatory_mobile,
          }
        : null,
      branding: {
        brand_colors: app.brand_colors,
        digital_support: app.digital_support,
        has_marketing_budget: app.has_marketing_budget,
      },
      promo_code: app.promo_code,
      documents: docs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seller-application-${app.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Drawer.Header>
        <div className="flex items-center justify-between w-full">
          <Drawer.Title>Seller Application — {app.business_name}</Drawer.Title>
          <div className="flex items-center gap-2">
            {statusBadge(app.status)}
            <button onClick={handleDownload} title="Download JSON" className="p-1 rounded hover:bg-ui-bg-subtle text-ui-fg-subtle hover:text-ui-fg-base transition-colors">
              <ArrowDownTray className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Drawer.Header>

      <Drawer.Body className="p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex gap-4 text-xs text-ui-fg-muted flex-wrap">
          <span>ID: <span className="font-mono text-ui-fg-subtle">{app.id}</span></span>
          <span>Submitted: {formatDate(app.submitted_at)}</span>
          {app.reviewed_at && <span>Reviewed: {formatDate(app.reviewed_at)}</span>}
        </div>

        <Section title="Merchant Details">
          <Grid>
            <Field label="First Name" value={app.first_name} />
            <Field label="Last Name" value={app.last_name} />
            <Field label="Email" value={app.email} />
            <Field label="Mobile Number" value={app.mobile_number} />
            <Field label="Designation" value={app.designation} />
            <Field label="Target Go-Live" value={app.target_go_live} />
          </Grid>
          <Field label="Complete Address" value={app.complete_address} />
        </Section>

        <Section title="Business Profile">
          <Grid>
            <Field label="Business Name" value={app.business_name} />
            <Field label="Organization Type" value={app.form_of_organization} />
            <Field label="Business TIN" value={app.business_tin} />
            <Field label="Merchant Category" value={app.merchant_category} />
            <Field label="Business Landline" value={app.business_landline} />
            <Field label="Business Mobile" value={app.business_mobile} />
            <Field label="Business Email" value={app.business_email} />
            <Field label="Business Activity" value={app.business_activity} />
          </Grid>
          <Field label="Business Address" value={app.business_address} />
        </Section>

        {app.signatory_first_name && (
          <Section title="Authorized Signatory">
            <Grid>
              <Field label="First Name" value={app.signatory_first_name} />
              <Field label="Middle Name" value={app.signatory_middle_name} />
              <Field label="Last Name" value={app.signatory_last_name} />
              <Field label="Email" value={app.signatory_email} />
              <Field label="Landline" value={app.signatory_landline} />
              <Field label="Mobile" value={app.signatory_mobile} />
            </Grid>
          </Section>
        )}

        <Section title="Branding & Digital">
          <Grid>
            <Field label="Brand Colors" value={app.brand_colors} />
            <Field
              label="Has Marketing Budget"
              value={
                app.has_marketing_budget === true ? "Yes" :
                app.has_marketing_budget === false ? "No" : undefined
              }
            />
            <Field label="Promo Code" value={app.promo_code} />
          </Grid>
          <Field
            label="Digital Support Channels"
            value={
              Array.isArray(app.digital_support) && app.digital_support.length
                ? app.digital_support.join(", ")
                : null
            }
          />
        </Section>

        <Section title="Submitted Documents">
          {Object.keys(docs).length === 0 ? (
            <Text className="text-sm text-ui-fg-muted">No documents submitted.</Text>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(docs).map(([key, url]) => (
                <div key={key} className="flex items-center justify-between gap-2 text-sm">
                  <Text className="text-ui-fg-base capitalize">{key.replace(/_/g, " ")}</Text>
                  <a
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ui-fg-interactive hover:underline text-xs font-medium flex items-center gap-1"
                  >
                    <ArrowDownTray className="w-3 h-3" />
                    View / Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </Section>

        {app.status === "pending" && (
          <div className="flex flex-col gap-1.5">
            <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted">Admin Notes (optional)</Text>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add a note for this decision (optional)…"
              rows={3}
            />
          </div>
        )}

        {app.admin_notes && (
          <div className="rounded-xl bg-ui-bg-subtle border border-ui-border-base p-3">
            <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted mb-1">Admin Notes</Text>
            <Text className="text-sm text-ui-fg-base">{app.admin_notes}</Text>
          </div>
        )}

        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 text-xs font-medium text-ui-fg-base hover:bg-ui-bg-subtle transition-colors mr-auto"
          >
            <ArrowDownTray className="w-3.5 h-3.5" />
            Download JSON
          </button>

          {app.status === "pending" ? (
            <>
              <Button variant="danger" isLoading={updateMutation.isPending || reviewMutation.isPending} onClick={() => handleAction("rejected")}>
                Reject
              </Button>
              <Button isLoading={updateMutation.isPending || reviewMutation.isPending} onClick={() => handleAction("approved")}>
                Approve
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={close}>Close</Button>
          )}
        </div>
      </Drawer.Footer>
    </>
  );
}

// ─── Legacy request drawer ────────────────────────────────────────────────────

function LegacyDrawer({ row, close }: { row: LegacyRow; close: () => void }) {
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");

  const reviewMutation = useReviewRequest({
    onSuccess: () => close(),
    onError: (err: Error) => setActionError(err.message || "Action failed"),
  });

  const data = (row.data ?? {}) as any;
  const canReview = row._normalizedStatus === "pending";

  const handleAction = (status: "accepted" | "rejected") => {
    if (!row.id) return;
    setActionError("");
    reviewMutation.mutate({ id: row.id, payload: { status, reviewer_note: note || undefined } });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ id: row.id, status: row.status, created_at: row.created_at, data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seller-request-${row.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Drawer.Header>
        <div className="flex items-center justify-between w-full">
          <Drawer.Title>Seller Request — {row._name || row.id}</Drawer.Title>
          <div className="flex items-center gap-2">
            {statusBadge(row._normalizedStatus)}
            <span className="text-[10px] text-ui-fg-muted border border-ui-border-base rounded px-1.5 py-0.5">legacy</span>
          </div>
        </div>
      </Drawer.Header>

      <Drawer.Body className="p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This is a legacy seller request submitted via the old registration system. Only basic information is available.
        </div>

        <div className="flex gap-4 text-xs text-ui-fg-muted flex-wrap">
          <span>ID: <span className="font-mono text-ui-fg-subtle">{row.id}</span></span>
          <span>Submitted: {formatDate(row.created_at ?? "")}</span>
        </div>

        <Section title="Applicant">
          <Grid>
            <Field label="Name" value={row._name} />
            <Field label="Email" value={row._email} />
          </Grid>
        </Section>

        {data?.seller && (
          <Section title="Seller Info">
            <Field label="Seller Name" value={data.seller?.name} />
          </Section>
        )}

        {canReview && (
          <div className="flex flex-col gap-1.5">
            <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted">Reviewer Note (optional)</Text>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              rows={3}
            />
          </div>
        )}

        {row.reviewer_note && (
          <div className="rounded-xl bg-ui-bg-subtle border border-ui-border-base p-3">
            <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted mb-1">Reviewer Note</Text>
            <Text className="text-sm text-ui-fg-base">{row.reviewer_note}</Text>
          </div>
        )}

        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2 text-xs font-medium text-ui-fg-base hover:bg-ui-bg-subtle transition-colors mr-auto"
          >
            <ArrowDownTray className="w-3.5 h-3.5" />
            Download JSON
          </button>

          {canReview ? (
            <>
              <Button variant="danger" isLoading={reviewMutation.isPending} onClick={() => handleAction("rejected")}>
                Reject
              </Button>
              <Button isLoading={reviewMutation.isPending} onClick={() => handleAction("accepted")}>
                Approve
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={close}>Close</Button>
          )}
        </div>
      </Drawer.Footer>
    </>
  );
}

// ─── Combined drawer ──────────────────────────────────────────────────────────

export function RequestSellerDetail({ row, open, close, matchedRequest }: Props) {
  if (!row) return null;

  return (
    <Drawer open={open} onOpenChange={close}>
      <Drawer.Content className="max-w-2xl">
        {row._source === "new"
          ? <NewAppDrawer row={row as NewAppRow} matchedRequest={matchedRequest} close={close} />
          : <LegacyDrawer row={row as LegacyRow} close={close} />
        }
      </Drawer.Content>
    </Drawer>
  );
}
