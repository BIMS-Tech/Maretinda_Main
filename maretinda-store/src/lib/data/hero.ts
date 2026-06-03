'use server'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

const baseHeaders = () => ({
  'x-publishable-api-key': PUB_KEY,
  'Content-Type': 'application/json',
})

export interface HeroWelcomePromo {
  id: string
  code: string
  discount_label: string
  min_order?: number
  expires_at?: string | null
  metadata?: Record<string, any> | null
}

export interface HeroFeaturedCampaign {
  id: string
  name: string
  description: string | null
  ends_at: string | null
  badge_label: string | null
  discount_label: string | null
  shop_link: string
}

export interface HeroSiteSettings {
  heading?: string
  subheading?: string
  badge?: string
  featured_product_name?: string
  featured_product_category?: string
  featured_product_price?: number
  featured_product_original_price?: number
  featured_product_rating_count?: number
  featured_product_sold_this_week?: number
  featured_product_link?: string
  featured_product_image?: string
  vendors_count?: string
}

export interface HeroContent {
  welcome_promo: HeroWelcomePromo | null
  featured_campaign: HeroFeaturedCampaign | null
  site_settings: HeroSiteSettings
  sellers_count: string | null
}

export async function getHeroContent(): Promise<HeroContent> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/hero-content`, {
      headers: baseHeaders(),
      next: { revalidate: 300, tags: ['hero-content'] },
    })
    if (!res.ok) return { welcome_promo: null, featured_campaign: null, site_settings: {}, sellers_count: null }
    return await res.json()
  } catch {
    return { welcome_promo: null, featured_campaign: null, site_settings: {}, sellers_count: null }
  }
}
