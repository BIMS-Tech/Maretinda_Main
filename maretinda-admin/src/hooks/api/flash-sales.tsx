import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { FlashSale, FlashSaleItem, FlashSaleStatus } from "../../lib/flash-sales"

const FLASH_SALE_KEY = "flash_sales"

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

  const res = await (sdk as any).client.fetch(`/admin/flash-sales?${query}`)
  return res
}

async function fetchFlashSale(id: string): Promise<{ flash_sale: FlashSale }> {
  return (sdk as any).client.fetch(`/admin/flash-sales/${id}`)
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

export function useCreateFlashSale(options?: UseMutationOptions<{ flash_sale: FlashSale }, any, any>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) => (sdk as any).client.fetch("/admin/flash-sales", { method: "POST", body }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useUpdateFlashSale(
  id: string,
  options?: UseMutationOptions<{ flash_sale: FlashSale }, any, any>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}`, { method: "PUT", body }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useDeleteFlashSale(options?: UseMutationOptions<any, any, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}`, { method: "DELETE" }),
    onSuccess: (data, id, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, id, ...args)
    },
    ...options,
  })
}

export function usePublishFlashSale(id: string, options?: UseMutationOptions<any, any, void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}/publish`, { method: "POST" }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useReviveFlashSale(id: string, options?: UseMutationOptions<any, any, { ends_at?: string } | void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body?: { ends_at?: string }) =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}/revive`, { method: "POST", body: body ?? {} }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useEndFlashSale(id: string, options?: UseMutationOptions<any, any, void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}/end`, { method: "POST" }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useApproveFlashSale(id: string, options?: UseMutationOptions<any, any, void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}/approve`, { method: "POST" }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useRejectFlashSale(id: string, options?: UseMutationOptions<any, any, void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      (sdk as any).client.fetch(`/admin/flash-sales/${id}/reject`, { method: "POST" }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useAddFlashSaleItem(
  flashSaleId: string,
  options?: UseMutationOptions<{ item: FlashSaleItem }, any, any>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) =>
      (sdk as any).client.fetch(`/admin/flash-sales/${flashSaleId}/items`, { method: "POST", body }),
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
      (sdk as any).client.fetch(`/admin/flash-sales/${flashSaleId}/items/${itemId}`, {
        method: "PUT",
        body,
      }),
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
      (sdk as any).client.fetch(`/admin/flash-sales/${flashSaleId}/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(flashSaleId) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useApproveFlashSaleItem(
  flashSaleId: string,
  itemId: string,
  options?: UseMutationOptions<any, any, void>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      (sdk as any).client.fetch(`/admin/flash-sales/${flashSaleId}/items/${itemId}`, {
        method: "PUT",
        body: { action: "approve" },
      }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(flashSaleId) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useRejectFlashSaleItem(
  flashSaleId: string,
  itemId: string,
  options?: UseMutationOptions<any, any, void>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      (sdk as any).client.fetch(`/admin/flash-sales/${flashSaleId}/items/${itemId}`, {
        method: "PUT",
        body: { action: "reject" },
      }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: flashSaleKeys.detail(flashSaleId) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}
