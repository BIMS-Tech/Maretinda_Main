import { sdk } from "@lib/client";
import { queryKeysFactory } from "@lib/query-key-factory";
import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export interface SellerApplication {
  id: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  seller_id: string | null;

  // Merchant Details
  first_name: string;
  last_name: string;
  complete_address: string;
  mobile_number: string;
  email: string;
  designation: string | null;
  target_go_live: string | null;

  // Business Profile
  business_name: string;
  business_address: string;
  business_landline: string | null;
  business_mobile: string | null;
  business_email: string | null;
  business_tin: string | null;
  form_of_organization: string;
  merchant_category: string | null;
  business_activity: string | null;

  // Authorized Signatory
  signatory_first_name: string | null;
  signatory_middle_name: string | null;
  signatory_last_name: string | null;
  signatory_email: string | null;
  signatory_landline: string | null;
  signatory_mobile: string | null;

  // Branding & Digital
  brand_colors: string | null;
  digital_support: string[] | null;
  has_marketing_budget: boolean | null;

  // Promo / referral code entered at registration
  promo_code: string | null;

  // Documents (key → URL map)
  documents: Record<string, string> | null;
}

export const sellerApplicationsQueryKeys = queryKeysFactory("seller-applications");

export const useSellerApplications = (params?: { status?: string; limit?: number; offset?: number }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  const qsStr = qs.toString();

  const { data, ...other } = useQuery({
    queryKey: sellerApplicationsQueryKeys.list(params),
    queryFn: async () => {
      const result = await sdk.client.fetch<{ applications: SellerApplication[]; count: number }>(
        `/admin/seller-applications${qsStr ? `?${qsStr}` : ""}`,
        { method: "GET" }
      );
      return result as any;
    },
  });
  return { applications: (data as any)?.applications ?? [], count: (data as any)?.count ?? 0, ...other };
};

export const useUpdateSellerApplication = (
  id: string,
  options?: UseMutationOptions<
    { application: SellerApplication },
    Error,
    { status: "pending" | "approved" | "rejected"; admin_notes?: string }
  >
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const result = await sdk.client.fetch<{ application: SellerApplication }>(
        `/admin/seller-applications/${id}`,
        { method: "PATCH", body: body as any }
      );
      return result as any;
    },
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: sellerApplicationsQueryKeys.lists() });
      options?.onSuccess?.(data, vars, ctx);
    },
    ...options,
  });
};
