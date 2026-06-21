import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk, backendUrl } from "../../lib/client"

export type AdminBrand = {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
  description?: string | null
  is_active: boolean
  requested_by?: string | null
  product_count?: number
  created_at?: string
  updated_at?: string
}

export type BrandProduct = {
  id: string
  title: string
  thumbnail?: string | null
  status?: string | null
  handle?: string | null
}

/** Upload a brand logo via Medusa's file service; returns the public URL. */
export async function uploadBrandLogo(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("files", file)
  const token = window.localStorage.getItem("medusa_admin_jwt") || ""
  const res = await fetch(`${backendUrl}/admin/uploads`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: fd,
  })
  if (!res.ok) throw new Error("Upload failed")
  const data = await res.json()
  return data.files?.[0]?.url ?? ""
}

const KEY = ["admin", "brands"]

export const adminBrandsQueryKeys = {
  all: KEY,
  list: (q?: string) => [...KEY, "list", q],
  detail: (id: string) => [...KEY, "detail", id],
  products: (id: string, q?: string, offset?: number) => [
    ...KEY,
    "products",
    id,
    q,
    offset,
  ],
}

type BrandListParams = { q?: string; limit?: number; offset?: number }

export function useAdminBrands(params?: string | BrandListParams) {
  const normalized: BrandListParams =
    typeof params === "string" ? { q: params } : params ?? {}
  const { q, limit, offset } = normalized

  const { data, isLoading, isError } = useQuery({
    queryKey: [...KEY, "list", q, limit, offset],
    queryFn: async () => {
      const search = new URLSearchParams()
      if (q) search.set("q", q)
      if (limit != null) search.set("limit", String(limit))
      if (offset != null) search.set("offset", String(offset))
      return (await sdk.client.fetch(`/admin/brands?${search.toString()}`, {
        method: "GET",
      })) as { brands: AdminBrand[]; count: number }
    },
  })
  return { brands: data?.brands ?? [], count: data?.count ?? 0, isLoading, isError }
}

export function useBrand(id: string, options?: { enabled?: boolean }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: adminBrandsQueryKeys.detail(id),
    queryFn: async () =>
      (await sdk.client.fetch(`/admin/brands/${id}`, { method: "GET" })) as {
        brand: AdminBrand
      },
    enabled: options?.enabled ?? !!id,
  })
  return { brand: data?.brand, isLoading, isError, error }
}

export function useBrandProducts(
  id: string,
  params?: { q?: string; limit?: number; offset?: number }
) {
  const { q, limit = 10, offset = 0 } = params ?? {}
  const { data, isLoading, isError, error } = useQuery({
    queryKey: adminBrandsQueryKeys.products(id, q, offset),
    queryFn: async () => {
      const search = new URLSearchParams()
      if (q) search.set("q", q)
      search.set("limit", String(limit))
      search.set("offset", String(offset))
      return (await sdk.client.fetch(
        `/admin/brands/${id}/products?${search.toString()}`,
        { method: "GET" }
      )) as { products: BrandProduct[]; count: number }
    },
    enabled: !!id,
  })
  return {
    products: data?.products ?? [],
    count: data?.count ?? 0,
    isLoading,
    isError,
    error,
  }
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

export function useUpdateBrandProducts(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { add?: string[]; remove?: string[] }) =>
      (await sdk.client.fetch(`/admin/brands/${id}/products`, {
        method: "POST",
        body,
      })) as { success: boolean; added: number; removed: number },
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
