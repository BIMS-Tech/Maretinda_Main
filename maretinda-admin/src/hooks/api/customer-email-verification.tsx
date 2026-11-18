import { sdk } from "@lib/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CustomerEmailVerification = {
  email: string | null;
  verified: boolean;
  /** "link", "google", "existing" (signed up before confirmation existed) or "admin" */
  method: string | null;
  verified_at: string | null;
};

const key = (id: string) => ["customer-email-verification", id];

export const useCustomerEmailVerification = (id: string) =>
  useQuery({
    queryKey: key(id),
    queryFn: () =>
      sdk.client.fetch<CustomerEmailVerification>(`/admin/customers/${id}/email-verification`, { method: "GET" }),
  });

/** Support confirms a buyer's email another way, when the link never arrived. */
export const useConfirmCustomerEmail = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ verified: boolean }>(`/admin/customers/${id}/email-verification`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(id) }),
  });
};
