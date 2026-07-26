import type { AdminRequest } from "@custom-types/requests";

/**
 * Seller sign-ups land in two places: the `seller_application` table (current
 * registration flow) and Mercur's generic `request` table (legacy). A single
 * registration can appear in both, keyed by email — these helpers let the list
 * and the sidebar badge dedupe them the same way.
 */
export type LegacySellerStatus = "pending" | "approved" | "rejected";

export function normalizeLegacyStatus(status?: string): LegacySellerStatus {
  if (status === "accepted") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

export function legacyRequestName(req: AdminRequest): string {
  const data = (req.data ?? {}) as any;
  return data?.member?.name || data?.seller?.name || "";
}

export function legacyRequestEmail(req: AdminRequest): string {
  const data = (req.data ?? {}) as any;
  return (
    data?.member?.email || data?.seller?.email || data?.provider_identity_id || ""
  );
}

export const emailKey = (email?: string | null): string =>
  (email || "").trim().toLowerCase();
