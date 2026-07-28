import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"

const REELS_KEY = "seller_reels"

export type ReelStatus = "draft" | "published" | "archived"

export type Reel = {
  id: string
  seller_id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration: number | null
  product_ids: string[]
  status: ReelStatus
  view_count: number
  like_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  seller_name?: string
  seller_handle?: string
}

export const reelKeys = {
  all: [REELS_KEY] as const,
  lists: () => [...reelKeys.all, "list"] as const,
  list: (filters: object) => [...reelKeys.lists(), filters] as const,
  detail: (id: string) => [...reelKeys.all, id] as const,
}

type ListParams = {
  status?: ReelStatus | ReelStatus[]
  limit?: number
  offset?: number
}

async function fetchReels(
  params: ListParams
): Promise<{ reels: Reel[]; count: number }> {
  const query = new URLSearchParams()
  if (params.status) {
    const statuses = Array.isArray(params.status)
      ? params.status
      : [params.status]
    statuses.forEach((s) => query.append("status", s))
  }
  if (params.limit) query.set("limit", String(params.limit))
  if (params.offset) query.set("offset", String(params.offset))
  return (sdk as any).client.fetch(`/vendor/reels?${query}`)
}

export function useReels(
  params: ListParams = {},
  options?: UseQueryOptions<{ reels: Reel[]; count: number }>
) {
  const { data, ...rest } = useQuery({
    queryKey: reelKeys.list(params),
    queryFn: () => fetchReels(params),
    ...options,
  })
  return { reels: data?.reels, count: data?.count, ...rest }
}

export function useReel(id: string, options?: UseQueryOptions<{ reel: Reel }>) {
  const { data, ...rest } = useQuery({
    queryKey: reelKeys.detail(id),
    queryFn: () => (sdk as any).client.fetch(`/vendor/reels/${id}`),
    enabled: !!id,
    ...options,
  })
  return { reel: data?.reel, ...rest }
}

export function useCreateReel(
  options?: UseMutationOptions<{ reel: Reel }, any, any>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) =>
      (sdk as any).client.fetch(`/vendor/reels`, { method: "POST", body }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useUpdateReel(
  id: string,
  options?: UseMutationOptions<{ reel: Reel }, any, any>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) =>
      (sdk as any).client.fetch(`/vendor/reels/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reelKeys.detail(id) })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}

export function useDeleteReel(options?: UseMutationOptions<any, any, string>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      (sdk as any).client.fetch(`/vendor/reels/${id}`, { method: "DELETE" }),
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() })
      options?.onSuccess?.(data, ...args)
    },
    ...options,
  })
}
