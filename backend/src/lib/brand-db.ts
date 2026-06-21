/**
 * Raw-pg helpers for the brand catalog (tables: `brand`, `product_brand`).
 * Mirrors the shipping tables' approach so it doesn't rely on module migrations.
 */

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { randomUUID } from 'crypto'

export function getPg(scope: any): any {
  try {
    return scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return scope.__pg_connection__ || scope.pgConnection
  }
}

export function genId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Seller id for the authenticated member, or null. */
export async function getSellerId(scope: any, actorId?: string): Promise<string | null> {
  if (!actorId) return null
  const pg = getPg(scope)
  const member = await pg('member').where('id', actorId).first()
  return member?.seller_id ?? null
}

/** Does this seller own the product? */
export async function sellerOwnsProduct(scope: any, sellerId: string, productId: string): Promise<boolean> {
  const pg = getPg(scope)
  const row = await pg('seller_seller_product_product')
    .where({ seller_id: sellerId, product_id: productId })
    .whereNull('deleted_at')
    .first()
  return Boolean(row)
}

/** Current brand for a product (or null). */
export async function getProductBrand(scope: any, productId: string): Promise<any | null> {
  const pg = getPg(scope)
  const row = await pg('product_brand as pb')
    .join('brand as b', 'b.id', 'pb.brand_id')
    .where('pb.product_id', productId)
    .whereNull('pb.deleted_at')
    .whereNull('b.deleted_at')
    .select('b.id', 'b.name', 'b.slug', 'b.logo_url')
    .first()
  return row ?? null
}

/** Assign (replace) a product's brand. */
export async function setProductBrand(scope: any, productId: string, brandId: string): Promise<void> {
  const pg = getPg(scope)
  await pg('product_brand').where({ product_id: productId }).whereNull('deleted_at').del()
  await pg('product_brand').insert({
    id: genId('pbr'),
    product_id: productId,
    brand_id: brandId,
  })
}

/** Remove a product's brand. */
export async function clearProductBrand(scope: any, productId: string): Promise<void> {
  const pg = getPg(scope)
  await pg('product_brand').where({ product_id: productId }).whereNull('deleted_at').del()
}

/** Number of (non-deleted) products assigned to a brand. */
export async function countBrandProducts(scope: any, brandId: string): Promise<number> {
  const pg = getPg(scope)
  const [{ count }] = await pg('product_brand as pb')
    .join('product as p', 'p.id', 'pb.product_id')
    .where('pb.brand_id', brandId)
    .whereNull('pb.deleted_at')
    .whereNull('p.deleted_at')
    .count('pb.id as count')
  return parseInt(String(count))
}

/** Products assigned to a brand (paginated, optional title search). */
export async function listBrandProducts(
  scope: any,
  brandId: string,
  opts: { q?: string; limit?: number; offset?: number } = {}
): Promise<{ products: any[]; count: number }> {
  const pg = getPg(scope)
  const { q, limit = 50, offset = 0 } = opts

  const base = pg('product_brand as pb')
    .join('product as p', 'p.id', 'pb.product_id')
    .where('pb.brand_id', brandId)
    .whereNull('pb.deleted_at')
    .whereNull('p.deleted_at')
  if (q) base.andWhereILike('p.title', `%${q}%`)

  const products = await base
    .clone()
    .orderBy('p.title', 'asc')
    .limit(limit)
    .offset(offset)
    .select('p.id', 'p.title', 'p.thumbnail', 'p.status', 'p.handle')
  const [{ count }] = await base.clone().count('pb.id as count')

  return { products, count: parseInt(String(count)) }
}
