'use server'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

export interface ProductBrand {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
}

/** Fetch the active brand assigned to a product (or null). */
export async function getProductBrand(productId: string): Promise<ProductBrand | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/brands/${productId}`, {
      next: { revalidate: 60 },
      headers: {
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.brand || null
  } catch {
    return null
  }
}
