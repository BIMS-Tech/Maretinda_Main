'use server'

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

export interface TrendingProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  created_at: string
  trending_score: number
  avg_rating: number | null
  review_count: number
}

export async function getTrendingProducts({
  category,
  limit = 12,
}: {
  category?: string
  limit?: number
} = {}): Promise<TrendingProduct[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) })
    if (category && category !== 'all') params.set('category', category)

    const res = await fetch(
      `${BACKEND_URL}/store/trending?${params.toString()}`,
      {
        next: { revalidate: 300 }, // 5-min cache
        headers: {
          'x-publishable-api-key':
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.products ?? []
  } catch {
    return []
  }
}
