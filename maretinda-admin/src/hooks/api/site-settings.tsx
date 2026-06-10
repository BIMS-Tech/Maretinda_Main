import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sdk } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-key-factory'

export interface HeroSettings {
  heading: string
  subheading: string
  badge: string
  featured_product_name: string
  featured_product_category: string
  featured_product_price: number
  featured_product_original_price: number
  featured_product_rating_count: number
  featured_product_sold_this_week: number
  featured_product_link: string
  featured_product_image: string
  sellers_count: string
  // sidebar promo card controls
  welcome_promo_code: string
  featured_campaign_id: string
}

export const siteSettingsQueryKeys = queryKeysFactory('site-settings')

export const useHeroSettings = () => {
  const { data, ...rest } = useQuery({
    queryKey: siteSettingsQueryKeys.list(['hero']),
    queryFn: async () => {
      const result = await sdk.client.fetch('/admin/site-settings?key=hero', { method: 'GET' })
      return result as { key: string; value: HeroSettings; updated_at: string }
    },
  })
  return { settings: data?.value, updatedAt: data?.updated_at, ...rest }
}

export const useUpdateHeroSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (value: HeroSettings) => {
      return sdk.client.fetch('/admin/site-settings', {
        method: 'PUT',
        body: { key: 'hero', value },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteSettingsQueryKeys.list(['hero']) })
    },
  })
}

export interface TrendingProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  trending_score: number
  avg_rating: number
  review_count: number
}

export const useTrendingProducts = () => {
  return useQuery({
    queryKey: ['admin-trending-products'],
    queryFn: async () => {
      const result = await sdk.client.fetch('/admin/trending-products?limit=10', { method: 'GET' })
      return (result as { products: TrendingProduct[] }).products
    },
  })
}
