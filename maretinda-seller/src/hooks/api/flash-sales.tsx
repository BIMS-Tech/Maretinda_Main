import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { FlashSale, FlashSaleItem, FlashSaleStatus } from "../../lib/flash-sales"

const FLASH_SALE_KEY = "seller_flash_sales"

export const flashSaleKeys = {
  all: [FLASH_SALE_KEY] as const,
  lists: () => [...flashSaleKeys.all, "list"] as const,
  list: (filters: object) => [...flashSaleKeys.lists(), filters] as const,
  detail: (id: string) => [...flashSaleKeys.all, id] as const,
}

async function fetchFlashSales(params: {
  status?: FlashSaleStatus | FlashSaleStatus[]
  limit?: number
  offset?: number
}): Promise<{ flash_sales: FlashSale[]; count: number }> {
  const query = new URLSearchParams()
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    statuses.forEach((s) => query.append("status", s))
  }
  if (params.limit) query.set("limit", String(params.limit))
  if (params.offset) query.set("offset", String(params.offset))
  return (sdk as any).client.fetch(`/vendor/flash-sales?${query}`)
}

async function fetchFlashSale(id: string): Promise<{ flash_sale: FlashSale }> {
  return (sdk as any).client.fetch(`/vendor/flash-sales/${id}`)
}

export function useFlashSales(
  params: { status?: FlashSaleStatus | FlashSaleStatus[]; limit?: number; offset?: number } = {},
  options?: UseQueryOptions<{ flash_sales: FlashSale[]; count: number }>
) {
  const { data, ...rest } = useQuery({
    queryKey: flashSaleKeys.list(params),
    queryFn: () => fetchFlashSales(params),
    ...options,
  })
  return { flash_sales: data?.flash_sales, count: data?.count, ...rest }
}

export function useFlashSale(id: string, options?: UseQueryOptions<{ flash_sale: FlashSale }>) {
  const { data, ...rest } = useQuery({
    queryKey: flashSaleKeys.detail(id),
    queryFn: () => fetchFlashSale(id),
    enabled: !!id,
    ...options,
  })
  return { flash_sale: data?.flash_sale, ...rest }
}




export function useAddFlashSaleItem(
  flashSaleId: string,
  options?: UseMutationOptions<{ item: FlashSaleItem }, any, any>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) =>
      (sdk as any).client.fetch(`/vendor/flash-sales/${flashSaleId}/items`, {
        method: "POST",
        body,
      }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(flashSaleId) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useUpdateFlashSaleItem(
  flashSaleId: string,
  itemId: string,
  options?: UseMutationOptions<{ item: FlashSaleItem }, any, any>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) =>
      (sdk as any).client.fetch(
        `/vendor/flash-sales/${flashSaleId}/items/${itemId}`,
        { method: "PUT", body }
      ),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(flashSaleId) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useRemoveFlashSaleItem(
  flashSaleId: string,
  options?: UseMutationOptions<any, any, string>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) =>
      (sdk as any).client.fetch(
        `/vendor/flash-sales/${flashSaleId}/items/${itemId}`,
        { method: "DELETE" }
      ),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(flashSaleId) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}
