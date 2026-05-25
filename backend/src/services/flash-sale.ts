import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type FlashSaleStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "cancelled"

export type DiscountType = "percentage" | "fixed"
export type ItemStatus = "pending" | "approved" | "rejected"

export interface FlashSale {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  status: FlashSaleStatus
  banner_image: string | null
  max_order_quantity: number | null
  created_at: string
  updated_at: string
  items?: FlashSaleItem[]
}

export interface FlashSaleItem {
  id: string
  flash_sale_id: string
  product_id: string
  variant_id: string | null
  discount_type: DiscountType
  discount_value: number
  stock_limit: number | null
  sold_count: number
  seller_id: string | null
  item_status: ItemStatus
  created_at: string
  updated_at: string
  product?: any
}

export interface CreateFlashSaleInput {
  title: string
  description?: string
  starts_at: string
  ends_at: string
  banner_image?: string
  max_order_quantity?: number
}

export interface UpdateFlashSaleInput {
  title?: string
  description?: string
  starts_at?: string
  ends_at?: string
  banner_image?: string
  max_order_quantity?: number
}

export interface CreateFlashSaleItemInput {
  product_id: string
  variant_id?: string
  discount_type: DiscountType
  discount_value: number
  stock_limit?: number
  seller_id?: string
}

export interface UpdateFlashSaleItemInput {
  discount_type?: DiscountType
  discount_value?: number
  stock_limit?: number
}

function generateId(prefix: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${ts}${rand}`
}

class FlashSaleService {
  private pgConnection: any

  constructor(container: MedusaContainer) {
    try {
      this.pgConnection = (container as any).resolve(
        ContainerRegistrationKeys.PG_CONNECTION
      )
    } catch {
      this.pgConnection =
        (container as any).__pg_connection__ ||
        (container as any).pgConnection
    }
  }

  async initTables(): Promise<void> {
    await this.pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS "flash_sale" (
        "id" VARCHAR PRIMARY KEY,
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "starts_at" TIMESTAMPTZ NOT NULL,
        "ends_at" TIMESTAMPTZ NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'draft',
        "banner_image" VARCHAR,
        "max_order_quantity" INTEGER,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `)

    await this.pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS "flash_sale_item" (
        "id" VARCHAR PRIMARY KEY,
        "flash_sale_id" VARCHAR NOT NULL,
        "product_id" VARCHAR NOT NULL,
        "variant_id" VARCHAR,
        "discount_type" VARCHAR NOT NULL DEFAULT 'percentage',
        "discount_value" DECIMAL(10,2) NOT NULL,
        "stock_limit" INTEGER,
        "sold_count" INTEGER NOT NULL DEFAULT 0,
        "seller_id" VARCHAR,
        "item_status" VARCHAR NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // Migrate: add columns if table already existed without them
    await this.pgConnection.raw(`
      ALTER TABLE "flash_sale_item"
        ADD COLUMN IF NOT EXISTS "seller_id" VARCHAR,
        ADD COLUMN IF NOT EXISTS "item_status" VARCHAR NOT NULL DEFAULT 'pending'
    `)

    // Items added directly by admin are auto-approved
    await this.pgConnection.raw(`
      UPDATE "flash_sale_item" SET "item_status" = 'approved'
      WHERE "item_status" = 'pending' AND "seller_id" IS NULL
    `)

    await this.pgConnection.raw(`
      CREATE INDEX IF NOT EXISTS "idx_flash_sale_status" ON "flash_sale" ("status")
      WHERE "deleted_at" IS NULL
    `)

    await this.pgConnection.raw(`
      CREATE INDEX IF NOT EXISTS "idx_flash_sale_item_sale_id" ON "flash_sale_item" ("flash_sale_id")
    `)
  }

  async list(filters: {
    status?: FlashSaleStatus | FlashSaleStatus[]
    limit?: number
    offset?: number
  } = {}): Promise<{ flash_sales: FlashSale[]; count: number }> {
    const { limit = 20, offset = 0 } = filters

    let whereClause = `WHERE fs.deleted_at IS NULL`
    const bindings: any[] = []

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      const placeholders = statuses.map(() => "?").join(", ")
      whereClause += ` AND fs.status IN (${placeholders})`
      bindings.push(...statuses)
    }

    const countResult = await this.pgConnection.raw(
      `SELECT COUNT(*) as total FROM "flash_sale" fs ${whereClause}`,
      bindings
    )
    const total = parseInt(countResult.rows?.[0]?.total || 0)

    const result = await this.pgConnection.raw(
      `SELECT fs.*,
        (SELECT COUNT(*) FROM "flash_sale_item" fsi WHERE fsi.flash_sale_id = fs.id AND fsi.item_status = 'approved') as item_count,
        (SELECT COUNT(*) FROM "flash_sale_item" fsi WHERE fsi.flash_sale_id = fs.id AND fsi.item_status = 'pending') as pending_count
       FROM "flash_sale" fs
       ${whereClause}
       ORDER BY fs.created_at DESC
       LIMIT ? OFFSET ?`,
      [...bindings, limit, offset]
    )

    return { flash_sales: result.rows || [], count: total }
  }

  /** List events visible to a vendor, with their application counts */
  async listForVendor(sellerId: string, filters: { limit?: number; offset?: number } = {}): Promise<{ flash_sales: any[]; count: number }> {
    const { limit = 20, offset = 0 } = filters

    const countResult = await this.pgConnection.raw(
      `SELECT COUNT(*) as total FROM "flash_sale" WHERE deleted_at IS NULL AND status NOT IN ('ended', 'cancelled')`
    )
    const total = parseInt(countResult.rows?.[0]?.total || 0)

    const result = await this.pgConnection.raw(
      `SELECT fs.*,
        (SELECT COUNT(*) FROM "flash_sale_item" fsi WHERE fsi.flash_sale_id = fs.id AND fsi.item_status = 'approved') as item_count,
        (SELECT COUNT(*) FROM "flash_sale_item" fsi WHERE fsi.flash_sale_id = fs.id AND fsi.seller_id = ?) as my_application_count,
        (SELECT COUNT(*) FROM "flash_sale_item" fsi WHERE fsi.flash_sale_id = fs.id AND fsi.seller_id = ? AND fsi.item_status = 'approved') as my_approved_count,
        (SELECT COUNT(*) FROM "flash_sale_item" fsi WHERE fsi.flash_sale_id = fs.id AND fsi.seller_id = ? AND fsi.item_status = 'pending') as my_pending_count
       FROM "flash_sale" fs
       WHERE fs.deleted_at IS NULL AND fs.status NOT IN ('ended', 'cancelled')
       ORDER BY fs.starts_at ASC
       LIMIT ? OFFSET ?`,
      [sellerId, sellerId, sellerId, limit, offset]
    )

    return { flash_sales: result.rows || [], count: total }
  }

  async retrieve(id: string, withItems = false, sellerIdFilter?: string): Promise<FlashSale | null> {
    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale" WHERE id = ? AND deleted_at IS NULL`,
      [id]
    )
    const sale = result.rows?.[0] || null
    if (!sale || !withItems) return sale

    let itemsQuery = `SELECT * FROM "flash_sale_item" WHERE flash_sale_id = ?`
    const itemsBindings: any[] = [id]

    if (sellerIdFilter) {
      itemsQuery += ` AND seller_id = ?`
      itemsBindings.push(sellerIdFilter)
    }

    itemsQuery += ` ORDER BY created_at ASC`
    const itemsResult = await this.pgConnection.raw(itemsQuery, itemsBindings)
    sale.items = itemsResult.rows || []
    return sale
  }

  async getActive(): Promise<FlashSale | null> {
    const now = new Date().toISOString()
    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale"
       WHERE status = 'active'
         AND starts_at <= ?
         AND ends_at > ?
         AND deleted_at IS NULL
       ORDER BY starts_at DESC
       LIMIT 1`,
      [now, now]
    )
    const sale = result.rows?.[0] || null
    if (!sale) return null

    // Only return approved items on the storefront
    const itemsResult = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale_item"
       WHERE flash_sale_id = ? AND item_status = 'approved'
       ORDER BY created_at ASC`,
      [sale.id]
    )
    sale.items = itemsResult.rows || []
    return sale
  }

  async listItemsForAdmin(flashSaleId: string): Promise<FlashSaleItem[]> {
    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale_item" WHERE flash_sale_id = ? ORDER BY item_status ASC, created_at ASC`,
      [flashSaleId]
    )
    return result.rows || []
  }

  async create(input: CreateFlashSaleInput): Promise<FlashSale> {
    const id = generateId("fs")
    const now = new Date().toISOString()
    const startsAt = new Date(input.starts_at)
    const status: FlashSaleStatus = startsAt > new Date() ? "scheduled" : "draft"

    await this.pgConnection.raw(
      `INSERT INTO "flash_sale"
       (id, title, description, starts_at, ends_at, status, banner_image, max_order_quantity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.title,
        input.description || null,
        input.starts_at,
        input.ends_at,
        status,
        input.banner_image || null,
        input.max_order_quantity || null,
        now,
        now,
      ]
    )

    return (await this.retrieve(id))!
  }

  async update(id: string, input: UpdateFlashSaleInput): Promise<FlashSale> {
    const now = new Date().toISOString()
    const setClauses: string[] = ["updated_at = ?"]
    const bindings: any[] = [now]

    if (input.title !== undefined) { setClauses.push("title = ?"); bindings.push(input.title) }
    if (input.description !== undefined) { setClauses.push("description = ?"); bindings.push(input.description) }
    if (input.starts_at !== undefined) { setClauses.push("starts_at = ?"); bindings.push(input.starts_at) }
    if (input.ends_at !== undefined) { setClauses.push("ends_at = ?"); bindings.push(input.ends_at) }
    if (input.banner_image !== undefined) { setClauses.push("banner_image = ?"); bindings.push(input.banner_image) }
    if (input.max_order_quantity !== undefined) { setClauses.push("max_order_quantity = ?"); bindings.push(input.max_order_quantity) }

    bindings.push(id)
    await this.pgConnection.raw(
      `UPDATE "flash_sale" SET ${setClauses.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      bindings
    )
    return (await this.retrieve(id))!
  }

  async updateStatus(id: string, status: FlashSaleStatus): Promise<FlashSale> {
    const now = new Date().toISOString()
    await this.pgConnection.raw(
      `UPDATE "flash_sale" SET status = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
      [status, now, id]
    )
    return (await this.retrieve(id))!
  }

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.pgConnection.raw(
      `UPDATE "flash_sale" SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    )
  }

  async addItem(flashSaleId: string, input: CreateFlashSaleItemInput): Promise<FlashSaleItem> {
    const id = generateId("fsi")
    const now = new Date().toISOString()
    // Admin-added items (no seller_id) are auto-approved
    const itemStatus: ItemStatus = input.seller_id ? "pending" : "approved"

    await this.pgConnection.raw(
      `INSERT INTO "flash_sale_item"
       (id, flash_sale_id, product_id, variant_id, discount_type, discount_value, stock_limit, sold_count, seller_id, item_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [
        id,
        flashSaleId,
        input.product_id,
        input.variant_id || null,
        input.discount_type,
        input.discount_value,
        input.stock_limit || null,
        input.seller_id || null,
        itemStatus,
        now,
        now,
      ]
    )

    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale_item" WHERE id = ?`,
      [id]
    )
    return result.rows[0]
  }

  async updateItem(itemId: string, input: UpdateFlashSaleItemInput): Promise<FlashSaleItem> {
    const now = new Date().toISOString()
    const setClauses: string[] = ["updated_at = ?"]
    const bindings: any[] = [now]

    if (input.discount_type !== undefined) { setClauses.push("discount_type = ?"); bindings.push(input.discount_type) }
    if (input.discount_value !== undefined) { setClauses.push("discount_value = ?"); bindings.push(input.discount_value) }
    if (input.stock_limit !== undefined) { setClauses.push("stock_limit = ?"); bindings.push(input.stock_limit) }

    bindings.push(itemId)
    await this.pgConnection.raw(
      `UPDATE "flash_sale_item" SET ${setClauses.join(", ")} WHERE id = ?`,
      bindings
    )

    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale_item" WHERE id = ?`,
      [itemId]
    )
    return result.rows[0]
  }

  async approveItem(itemId: string): Promise<FlashSaleItem> {
    const now = new Date().toISOString()
    await this.pgConnection.raw(
      `UPDATE "flash_sale_item" SET item_status = 'approved', updated_at = ? WHERE id = ?`,
      [now, itemId]
    )
    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale_item" WHERE id = ?`,
      [itemId]
    )
    return result.rows[0]
  }

  async rejectItem(itemId: string): Promise<FlashSaleItem> {
    const now = new Date().toISOString()
    await this.pgConnection.raw(
      `UPDATE "flash_sale_item" SET item_status = 'rejected', updated_at = ? WHERE id = ?`,
      [now, itemId]
    )
    const result = await this.pgConnection.raw(
      `SELECT * FROM "flash_sale_item" WHERE id = ?`,
      [itemId]
    )
    return result.rows[0]
  }

  async removeItem(itemId: string): Promise<void> {
    await this.pgConnection.raw(
      `DELETE FROM "flash_sale_item" WHERE id = ?`,
      [itemId]
    )
  }

  async incrementSoldCount(itemId: string, quantity = 1): Promise<void> {
    await this.pgConnection.raw(
      `UPDATE "flash_sale_item" SET sold_count = sold_count + ?, updated_at = NOW() WHERE id = ?`,
      [quantity, itemId]
    )
  }

  async processScheduled(): Promise<{ activated: number; ended: number }> {
    const now = new Date().toISOString()

    const activateResult = await this.pgConnection.raw(
      `UPDATE "flash_sale"
       SET status = 'active', updated_at = NOW()
       WHERE status = 'scheduled'
         AND starts_at <= ?
         AND deleted_at IS NULL
       RETURNING id`,
      [now]
    )

    const endResult = await this.pgConnection.raw(
      `UPDATE "flash_sale"
       SET status = 'ended', updated_at = NOW()
       WHERE status = 'active'
         AND ends_at <= ?
         AND deleted_at IS NULL
       RETURNING id`,
      [now]
    )

    return {
      activated: activateResult.rows?.length || 0,
      ended: endResult.rows?.length || 0,
    }
  }
}

export default FlashSaleService
