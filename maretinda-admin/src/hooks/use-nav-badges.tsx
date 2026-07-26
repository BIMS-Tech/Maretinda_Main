import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";
import { emailKey, legacyRequestEmail } from "@lib/seller-requests";
import type { AdminRequest } from "@custom-types/requests";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

export type NavBadgeSection = "orders" | "customers" | "requests";

/**
 * Sections counted as "new since you last looked". The watermark lives in
 * localStorage and is bumped whenever the admin opens the section, so the badge
 * clears itself by being read. Requests is deliberately absent — it counts
 * outstanding work, which clears by being actioned, not by being viewed.
 */
export type WatermarkSection = "orders" | "customers";

const STORAGE_KEY = "maretinda_admin_nav_seen";
const SEEN_QUERY_KEY = ["nav-badges", "seen"] as const;

const SECTION_PATHS: Record<WatermarkSection, string> = {
  orders: "/orders",
  customers: "/customers",
};

type SeenMap = Partial<Record<WatermarkSection, string>>;

const readSeen = (): SeenMap => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    return {};
  }
};

const writeSeen = (next: SeenMap) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / quota — badges just won't persist across reloads.
  }
};

const useSeen = () => {
  const { data } = useQuery({
    queryKey: SEEN_QUERY_KEY,
    queryFn: readSeen,
    initialData: readSeen,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return data ?? {};
};

export const markSectionSeen = (section: WatermarkSection) => {
  const current = readSeen();
  const next = { ...current, [section]: new Date().toISOString() };

  writeSeen(next);
  queryClient.setQueryData(SEEN_QUERY_KEY, next);
};

/**
 * An admin who has never opened a section shouldn't be greeted by a count of
 * every record ever created — treat their first visit to the panel as the
 * baseline instead.
 */
const useSeededSeen = () => {
  const seen = useSeen();

  useEffect(() => {
    const missing = (Object.keys(SECTION_PATHS) as WatermarkSection[]).filter(
      (section) => !seen[section],
    );

    if (!missing.length) {
      return;
    }

    const now = new Date().toISOString();
    const next = { ...readSeen() };
    missing.forEach((section) => {
      next[section] = now;
    });

    writeSeen(next);
    queryClient.setQueryData(SEEN_QUERY_KEY, next);
  }, [seen]);

  return seen;
};

/** Bumps the watermark for whichever section the admin is currently viewing. */
export const useMarkSectionSeenOnVisit = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = (
      Object.entries(SECTION_PATHS) as [WatermarkSection, string][]
    ).find(([, path]) => pathname === path || pathname.startsWith(`${path}/`));

    if (entry) {
      markSectionSeen(entry[0]);
    }
  }, [pathname]);
};

const REFETCH_INTERVAL = 1000 * 60;

export type PendingRequestCounts = {
  /** New-flow seller sign-ups awaiting review, plus any legacy request without one. */
  sellerApplications: number;
  /** Sellers who submitted their legal documents and await approval. */
  sellerVerifications: number;
  /** Product, tag, type, review-remove and order-return requests. */
  otherRequests: number;
};

/**
 * "Requests" in the sidebar spans three unrelated tables. Counting only
 * Mercur's `request` table misses seller applications entirely, which is the
 * one an admin most needs to see.
 */
export const usePendingRequestCounts = (): PendingRequestCounts => {
  const { data: applications } = useQuery({
    queryKey: ["nav-badges", "seller-applications"],
    queryFn: () =>
      sdk.client.fetch<{ applications?: { email?: string }[]; count?: number }>(
        "/admin/seller-applications?status=pending&limit=100",
        { method: "GET" },
      ),
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: verifications } = useQuery({
    queryKey: ["nav-badges", "seller-verifications"],
    queryFn: () =>
      sdk.client.fetch<{ pending_count?: number }>(
        "/admin/seller-verifications?status=pending_review",
        { method: "GET" },
      ),
    refetchInterval: REFETCH_INTERVAL,
  });

  // `/admin/requests` validates query params through `createFindParams`, which
  // strips a created_at watermark — pending is the actionable count anyway.
  const { data: allPending } = useQuery({
    queryKey: ["nav-badges", "requests", "pending"],
    queryFn: () =>
      sdk.client.fetch<{ count?: number }>("/admin/requests", {
        method: "GET",
        query: { limit: 1, status: "pending" },
      }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: pendingSellerRequests } = useQuery({
    queryKey: ["nav-badges", "requests", "pending", "seller"],
    queryFn: () =>
      sdk.client.fetch<{ requests?: AdminRequest[]; count?: number }>(
        "/admin/requests",
        {
          method: "GET",
          query: { limit: 200, status: "pending", type: "seller" },
        },
      ),
    refetchInterval: REFETCH_INTERVAL,
  });

  return useMemo(() => {
    const applicationEmails = new Set(
      (applications?.applications ?? []).map((a) => emailKey(a.email)).filter(Boolean),
    );

    // A registration can produce both an application and a legacy request;
    // the list hides the legacy row, so the badge must not count it twice.
    const unmatchedLegacy = (pendingSellerRequests?.requests ?? []).filter(
      (req) => !applicationEmails.has(emailKey(legacyRequestEmail(req))),
    ).length;

    const sellerPendingRequests = pendingSellerRequests?.count ?? 0;

    return {
      sellerApplications: (applications?.count ?? 0) + unmatchedLegacy,
      sellerVerifications: verifications?.pending_count ?? 0,
      otherRequests: Math.max(
        (allPending?.count ?? 0) - sellerPendingRequests,
        0,
      ),
    };
  }, [applications, verifications, allPending, pendingSellerRequests]);
};

export const useNavBadges = (): Record<NavBadgeSection, number> => {
  const seen = useSeededSeen();

  const { data: orders } = useQuery({
    queryKey: ["nav-badges", "orders", seen.orders],
    queryFn: () =>
      sdk.admin.order.list({
        limit: 1,
        fields: "id",
        created_at: { $gt: seen.orders },
      } as Record<string, unknown>),
    enabled: !!seen.orders,
    refetchInterval: REFETCH_INTERVAL,
  });

  const { data: customers } = useQuery({
    queryKey: ["nav-badges", "customers", seen.customers],
    queryFn: () =>
      sdk.admin.customer.list({
        limit: 1,
        fields: "id",
        created_at: { $gt: seen.customers },
      } as Record<string, unknown>),
    enabled: !!seen.customers,
    refetchInterval: REFETCH_INTERVAL,
  });

  const { sellerApplications, sellerVerifications, otherRequests } =
    usePendingRequestCounts();

  return {
    orders: orders?.count ?? 0,
    customers: customers?.count ?? 0,
    requests: sellerApplications + sellerVerifications + otherRequests,
  };
};
