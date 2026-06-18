import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

export type Brand = {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
}

const BRANDS_KEY = "vendor-brands"

/** List the platform brand catalog (for the product brand selector). */
export const useBrands = (q?: string) => {
  return useQuery({
    queryKey: [BRANDS_KEY, "list", q],
    queryFn: async (): Promise<{ brands: Brand[]; count: number }> => {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      return await fetchQuery(`/vendor/brands?${params.toString()}`, { method: "GET" })
    },
  })
}

/** The brand currently assigned to a product. */
export const useProductBrand = (productId: string) => {
  return useQuery({
    queryKey: [BRANDS_KEY, "product", productId],
    queryFn: async (): Promise<{ brand: Brand | null }> => {
      return await fetchQuery(`/vendor/products/${productId}/brand`, { method: "GET" })
    },
    enabled: !!productId,
  })
}

/** The seller's own brand requests (pending + approved). */
export const useMyBrandRequests = () => {
  return useQuery({
    queryKey: [BRANDS_KEY, "requests"],
    queryFn: async (): Promise<{ requests: (Brand & { status: string })[] }> => {
      return await fetchQuery("/vendor/brands/request", { method: "GET" })
    },
  })
}

/** Request a new brand (pending admin approval). */
export const useRequestBrand = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; logo_url?: string }) => {
      return await fetchQuery("/vendor/brands/request", { method: "POST", body })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANDS_KEY] })
    },
  })
}

/** Assign or clear a product's brand. */
export const useAssignProductBrand = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (brandId: string | null) => {
      if (!brandId) {
        return await fetchQuery(`/vendor/products/${productId}/brand`, { method: "DELETE" })
      }
      return await fetchQuery(`/vendor/products/${productId}/brand`, {
        method: "POST",
        body: { brand_id: brandId },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRANDS_KEY, "product", productId] })
    },
  })
}
