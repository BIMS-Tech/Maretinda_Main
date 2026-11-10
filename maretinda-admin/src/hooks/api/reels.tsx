import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sdk } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-key-factory'

export interface AdminReel {
  id: string
  seller_id: string
  seller_name: string
  seller_handle: string | null
  title: string
  video_url: string
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  moderation_status: 'visible' | 'hidden'
  moderation_reason: string | null
  view_count: number
  like_count: number
  created_at: string
}

export const reelQueryKeys = queryKeysFactory('admin-reels')

export const useAdminReels = (filters: {
  moderation_status?: 'visible' | 'hidden'
  q?: string
  limit: number
  offset: number
}) => {
  const query = new URLSearchParams()
  if (filters.moderation_status) query.set('moderation_status', filters.moderation_status)
  if (filters.q) query.set('q', filters.q)
  query.set('limit', String(filters.limit))
  query.set('offset', String(filters.offset))

  return useQuery<{ reels: AdminReel[]; count: number }>({
    queryKey: reelQueryKeys.list([filters]),
    queryFn: async () => (await sdk.client.fetch(`/admin/reels?${query}`, { method: 'GET' })) as any,
    staleTime: 15_000,
  })
}

const useReelAction = <TVars extends { id: string }>(request: (vars: TVars) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation<unknown, Error, TVars>({
    mutationFn: request,
    onSuccess: () => qc.invalidateQueries({ queryKey: reelQueryKeys.lists() }),
  })
}

export const useHideReel = () =>
  useReelAction<{ id: string; reason: string }>(({ id, reason }) =>
    sdk.client.fetch(`/admin/reels/${id}/hide`, { method: 'POST', body: { reason } as any })
  )

export const useUnhideReel = () =>
  useReelAction<{ id: string }>(({ id }) => sdk.client.fetch(`/admin/reels/${id}/unhide`, { method: 'POST' }))

export const useRemoveReel = () =>
  useReelAction<{ id: string }>(({ id }) => sdk.client.fetch(`/admin/reels/${id}`, { method: 'DELETE' }))
