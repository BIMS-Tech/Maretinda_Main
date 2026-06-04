import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export interface CustomerVoucher {
  id: string
  customer_id: string
  promotion_id: string
  promotion_code: string
  collected_at: string
  used_at: string | null
  expires_at: string | null
  metadata: Record<string, any> | null
}

export interface PromotionWithVoucher {
  id: string
  code: string
  type: string
  status?: string
  description?: string
  discount_label: string
  min_order?: number
  scope: "platform" | "seller"
  seller_id?: string
  seller_name?: string
  expires_at?: string | null
  is_collected?: boolean
  collected_voucher_id?: string
  metadata?: Record<string, any> | null
}

export default class VoucherService {
  private container: any

  constructor(container: any) {
    this.container = container
  }

  /**
   * List all promotions that are:
   * - status = "active"
   * - metadata.is_public = true  (admin sets this; vendor promotions are always public)
   *
   * Optionally filter to a single seller with seller_id param.
   */
  async listAvailablePromotions(
    customerId?: string,
    sellerIdFilter?: string
  ): Promise<PromotionWithVoucher[]> {
    const promotionService = this.container.resolve(Modules.PROMOTION)

    const promotions = await promotionService.listPromotions(
      { status: ["active"] },
      { take: 200, relations: ["application_method", "rules", "rules.values"] }
    )

    // Filter by seller scope and optional seller filter
    const visible = promotions.filter((p: any) => {
      const meta = p.metadata || {}
      if (meta.scope === "seller" || meta.seller_id) {
        if (sellerIdFilter && meta.seller_id !== sellerIdFilter) return false
        return true
      }
      // Platform promos: show all active ones (status filter already applied above)
      if (sellerIdFilter) return false // seller filter excludes platform promos
      return true
    })

    // Fetch collected status for this customer
    const collectedMap: Map<string, CustomerVoucher> = new Map()
    if (customerId) {
      const collected = await this.listCollectedVouchers(customerId)
      collected.forEach((cv) => collectedMap.set(cv.promotion_id, cv))
    }

    return visible.map((p: any) =>
      this.formatPromotion(p, collectedMap.get(p.id))
    )
  }

  /** Ensure the customer_voucher table exists (idempotent, called before any table access) */
  private async ensureTable(): Promise<void> {
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS customer_voucher (
        id             TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
        customer_id    TEXT        NOT NULL,
        promotion_id   TEXT        NOT NULL,
        promotion_code TEXT        NOT NULL,
        collected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        used_at        TIMESTAMPTZ,
        expires_at     TIMESTAMPTZ,
        metadata       JSONB,
        CONSTRAINT customer_voucher_pkey PRIMARY KEY (id),
        CONSTRAINT customer_voucher_unique UNIQUE (customer_id, promotion_id)
      );
      CREATE INDEX IF NOT EXISTS customer_voucher_customer_idx ON customer_voucher (customer_id);
      CREATE INDEX IF NOT EXISTS customer_voucher_promotion_idx ON customer_voucher (promotion_id);
    `)
  }

  /** List promotions collected by a customer */
  async listCollectedVouchers(customerId: string): Promise<CustomerVoucher[]> {
    await this.ensureTable()
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const result = await knex.raw(
      `SELECT * FROM customer_voucher WHERE customer_id = ? ORDER BY collected_at DESC`,
      [customerId]
    )
    return result.rows as CustomerVoucher[]
  }

  /** List collected vouchers enriched with promotion details */
  async listMyVouchers(customerId: string): Promise<PromotionWithVoucher[]> {
    const collected = await this.listCollectedVouchers(customerId)
    if (collected.length === 0) return []

    const promotionService = this.container.resolve(Modules.PROMOTION)
    const promotionIds = collected.map((cv) => cv.promotion_id)

    const promotions = await promotionService.listPromotions(
      { id: promotionIds },
      { take: promotionIds.length }
    )

    const promoMap = new Map(promotions.map((p: any) => [p.id, p]))

    return collected.map((cv) => {
      const promo = promoMap.get(cv.promotion_id) as any
      if (!promo) {
        return {
          id: cv.promotion_id,
          code: cv.promotion_code,
          type: "standard",
          discount_label: "Voucher",
          scope: "platform" as const,
          is_collected: true,
          collected_voucher_id: cv.id,
          expires_at: cv.expires_at,
        }
      }
      return this.formatPromotion(promo, cv)
    })
  }

  /** Collect a voucher (idempotent) */
  async collectVoucher(
    customerId: string,
    promotionId: string
  ): Promise<CustomerVoucher> {
    await this.ensureTable()
    const promotionService = this.container.resolve(Modules.PROMOTION)

    const [promotion] = await promotionService.listPromotions({ id: [promotionId] })
    if (!promotion) throw new Error("Promotion not found")
    if ((promotion as any).status !== "active") {
      throw new Error("This voucher is no longer available")
    }

    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    const existing = await knex.raw(
      `SELECT * FROM customer_voucher WHERE customer_id = ? AND promotion_id = ? LIMIT 1`,
      [customerId, promotionId]
    )
    if (existing.rows.length > 0) return existing.rows[0] as CustomerVoucher

    const expires_at = (promotion as any).ends_at || null

    const result = await knex.raw(
      `INSERT INTO customer_voucher (customer_id, promotion_id, promotion_code, expires_at, metadata)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [
        customerId,
        promotion.id,
        (promotion as any).code,
        expires_at,
        JSON.stringify((promotion as any).metadata || {}),
      ]
    )
    return result.rows[0] as CustomerVoucher
  }

  /** Remove a collected voucher */
  async removeCollectedVoucher(
    customerId: string,
    promotionId: string
  ): Promise<void> {
    await this.ensureTable()
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex.raw(
      `DELETE FROM customer_voucher WHERE customer_id = ? AND promotion_id = ?`,
      [customerId, promotionId]
    )
  }

  /** Mark voucher as used after order placed */
  async markVoucherUsed(customerId: string, promotionCode: string): Promise<void> {
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex.raw(
      `UPDATE customer_voucher SET used_at = now()
       WHERE customer_id = ? AND promotion_code = ? AND used_at IS NULL`,
      [customerId, promotionCode]
    )
  }

  formatPromotion(p: any, collected?: CustomerVoucher): PromotionWithVoucher {
    const method = p.application_method

    let discount_label = "Voucher"
    if (method) {
      if (method.type === "fixed") {
        const amount = (method.value || 0) / 100
        discount_label = `₱${amount.toLocaleString()} off`
      } else if (method.type === "percentage") {
        discount_label = `${method.value}% off`
      }
    }

    // Determine min order from rules (values are objects with a .value property)
    let min_order: number | undefined
    const subtotalRule = p.rules?.find((r: any) => r.attribute === "subtotal")
    if (subtotalRule?.values?.[0]) {
      const raw = subtotalRule.values[0]
      const scalar = typeof raw === "object" ? raw.value : raw
      const parsed = Number(scalar)
      if (!isNaN(parsed) && parsed > 0) min_order = parsed / 100
    }

    const meta = p.metadata || {}
    const isSellerScoped = meta.seller_id || meta.scope === "seller"

    return {
      id: p.id,
      code: p.code,
      type: p.type,
      status: p.status,
      description: meta.description || undefined,
      discount_label,
      min_order,
      scope: isSellerScoped ? "seller" : "platform",
      seller_id: meta.seller_id,
      seller_name: meta.seller_name,
      expires_at: p.ends_at || null,
      is_collected: !!collected,
      collected_voucher_id: collected?.id,
      metadata: p.metadata,
    }
  }
}
