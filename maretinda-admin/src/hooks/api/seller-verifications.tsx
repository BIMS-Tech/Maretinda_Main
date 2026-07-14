import { sdk } from "@lib/client";
import { queryKeysFactory } from "@lib/query-key-factory";
import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";

export interface SellerVerification {
  id: string;
  name: string | null;
  handle: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  form_of_organization: string | null;
  business_documents: Record<string, string> | string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
}

export const sellerVerificationsQueryKeys = queryKeysFactory("seller-verifications");

export const useSellerVerifications = (params?: { status?: string }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  const qsStr = qs.toString();

  const { data, ...other } = useQuery({
    queryKey: sellerVerificationsQueryKeys.list(params),
    queryFn: async () => {
      const result = await sdk.client.fetch<{ sellers: SellerVerification[]; pending_count: number }>(
        `/admin/seller-verifications${qsStr ? `?${qsStr}` : ""}`,
        { method: "GET" }
      );
      return result as any;
    },
  });
  return {
    sellers: (data as any)?.sellers ?? [],
    pendingCount: (data as any)?.pending_count ?? 0,
    ...other,
  };
};

export const useUpdateSellerVerification = (
  id: string,
  options?: UseMutationOptions<
    { seller: SellerVerification },
    Error,
    { status: VerificationStatus; notes?: string }
  >
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const result = await sdk.client.fetch<{ seller: SellerVerification }>(
        `/admin/seller-verifications/${id}`,
        { method: "PATCH", body: body as any }
      );
      return result as any;
    },
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: sellerVerificationsQueryKeys.lists() });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });
};

export function parseDocuments(
  documents: SellerVerification["business_documents"]
): Record<string, string> {
  if (!documents) return {};
  if (typeof documents === "string") {
    try {
      return JSON.parse(documents) || {};
    } catch {
      return {};
    }
  }
  return documents;
}
