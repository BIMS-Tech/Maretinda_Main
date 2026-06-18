import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

export type AdminBrand = {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const KEY = ["admin", "brands"]

export function useAdminBrands(q?: string) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...KEY, q],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      return (await sdk.client.fetch(`/admin/brands?${params.toString()}`, {
        method: "GET",
      })) as { brands: AdminBrand[]; count: number }
    },
  })
  return { brands: data?.brands ?? [], count: data?.count ?? 0, isLoading, isError }
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<AdminBrand>) =>
      (await sdk.client.fetch("/admin/brands", { method: "POST", body })) as {
        brand: AdminBrand
      },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AdminBrand> & { id: string }) =>
      (await sdk.client.fetch(`/admin/brands/${id}`, { method: "POST", body })) as {
        brand: AdminBrand
      },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      await sdk.client.fetch(`/admin/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useReindexBrands() {
  return useMutation({
    mutationFn: async () =>
      (await sdk.client.fetch("/admin/brands/reindex", { method: "POST" })) as {
        success: boolean
        reindexed: number
      },
  })
}
