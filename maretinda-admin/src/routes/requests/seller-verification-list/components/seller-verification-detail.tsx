import { useState } from "react";
import { Badge, Button, Drawer, Text, Textarea } from "@medusajs/ui";
import { ArrowDownTray } from "@medusajs/icons";

import {
  useUpdateSellerVerification,
  parseDocuments,
  type SellerVerification,
} from "@hooks/api/seller-verifications";

type Props = {
  seller: SellerVerification | null;
  open: boolean;
  close: () => void;
};

function statusBadge(status: string) {
  if (status === "verified") return <Badge color="green">Verified</Badge>;
  if (status === "rejected") return <Badge color="red">Rejected</Badge>;
  if (status === "pending_review") return <Badge color="orange">Pending review</Badge>;
  return <Badge color="grey">Not verified</Badge>;
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text className="text-xs text-ui-fg-muted font-medium uppercase tracking-wide">{label}</Text>
      <Text className="text-sm text-ui-fg-base">{value || "—"}</Text>
    </div>
  );
}

export const SellerVerificationDetail = ({ seller, open, close }: Props) => {
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState("");

  const mutation = useUpdateSellerVerification(seller?.id || "", {
    onSuccess: () => {
      setNotes("");
      close();
    },
    onError: (err) => setActionError(err.message || "Action failed"),
  });

  if (!seller) return null;

  const docs = parseDocuments(seller.business_documents);
  const docEntries = Object.entries(docs).filter(([, url]) => !!url);

  const handle = (status: "verified" | "rejected") => {
    setActionError("");
    mutation.mutate({ status, notes: notes || undefined });
  };

  const isVerified = seller.verification_status === "verified";

  return (
    <Drawer open={open} onOpenChange={(v) => !v && close()}>
      <Drawer.Content>
        <Drawer.Header>
          <div className="flex items-center gap-3">
            <Drawer.Title>Verify — {seller.name || seller.handle || seller.id}</Drawer.Title>
            {statusBadge(seller.verification_status)}
          </div>
        </Drawer.Header>

        <Drawer.Body className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="border border-ui-border-base rounded-xl p-4 grid grid-cols-2 gap-3">
            <Field label="Store" value={seller.name} />
            <Field label="Email" value={seller.email} />
            <Field label="Business TIN" value={seller.tax_id} />
            <Field label="Form of Organization" value={seller.form_of_organization} />
          </div>

          <div className="border border-ui-border-base rounded-xl p-4 flex flex-col gap-3">
            <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted">
              Documents
            </Text>
            {docEntries.length === 0 ? (
              <Text className="text-sm text-ui-fg-muted">No documents uploaded.</Text>
            ) : (
              <ul className="flex flex-col gap-2">
                {docEntries.map(([key, url]) => (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <Text className="text-sm text-ui-fg-base">{humanizeKey(key)}</Text>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive hover:underline font-medium"
                    >
                      <ArrowDownTray /> View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {seller.verification_notes && (
            <div className="border border-ui-border-base rounded-xl p-4">
              <Text className="text-xs font-bold uppercase tracking-widest text-ui-fg-muted mb-1">
                Previous notes
              </Text>
              <Text className="text-sm text-ui-fg-base">{seller.verification_notes}</Text>
            </div>
          )}

          {!isVerified && (
            <div className="flex flex-col gap-1.5">
              <Text className="text-xs text-ui-fg-muted font-medium uppercase tracking-wide">
                Notes (optional — shown to the seller on rejection)
              </Text>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          )}

          {actionError && <Text className="text-sm text-ui-fg-error">{actionError}</Text>}
        </Drawer.Body>

        <Drawer.Footer>
          {isVerified ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <Text className="text-sm text-ui-fg-subtle">This seller is verified.</Text>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  isLoading={mutation.isPending}
                  onClick={() => handle("rejected")}
                >
                  Revoke
                </Button>
                <Button variant="secondary" onClick={close}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
              <Button
                variant="danger"
                isLoading={mutation.isPending}
                onClick={() => handle("rejected")}
              >
                Reject
              </Button>
              <Button isLoading={mutation.isPending} onClick={() => handle("verified")}>
                Approve
              </Button>
            </div>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};
