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

  private get query() {
    return this.container.resolve(ContainerRegistrationKeys.QUERY)
  }

  private async getDb() {
    const { pgConnectionLoader } = this.container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    )
    const conn = pgConnectionLoader()
    return conn
  }

  private async rawQuery(sql: string, params: any[] = []) {
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    return knex.raw(sql, params)
  }

  /** List all active promotions available as vouchers */
  async listAvailablePromotions(customerId?: string): Promise<PromotionWithVoucher[]> {
    const promotionService = this.container.resolve(Modules.PROMOTION)

    const promotions = await promotionService.listPromotions(
      { status: ["active"] },
      { take: 100 }
    )

    // Fetch collected status for this customer
    let collectedMap: Map<string, CustomerVoucher> = new Map()
    if (customerId) {
      const collected = await this.listCollectedVouchers(customerId)
      collected.forEach((cv) => collectedMap.set(cv.promotion_id, cv))
    }

    return promotions.map((p: any) =>
      this.formatPromotion(p, collectedMap.get(p.id))
    )
  }

  /** List promotions collected by a customer */
  async listCollectedVouchers(customerId: string): Promise<CustomerVoucher[]> {
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

  /** Collect a voucher for a customer (idempotent) */
  async collectVoucher(
    customerId: string,
    promotionId: string
  ): Promise<CustomerVoucher> {
    const promotionService = this.container.resolve(Modules.PROMOTION)

    const [promotion] = await promotionService.listPromotions({ id: [promotionId] })
    if (!promotion) {
      throw new Error("Promotion not found")
    }
    if ((promotion as any).status !== "active") {
      throw new Error("This voucher is no longer available")
    }

    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Check if already collected
    const existing = await knex.raw(
      `SELECT * FROM customer_voucher WHERE customer_id = ? AND promotion_id = ? LIMIT 1`,
      [customerId, promotionId]
    )
    if (existing.rows.length > 0) {
      return existing.rows[0] as CustomerVoucher
    }

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
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex.raw(
      `DELETE FROM customer_voucher WHERE customer_id = ? AND promotion_id = ?`,
      [customerId, promotionId]
    )
  }

  /** Mark a voucher as used */
  async markVoucherUsed(customerId: string, promotionCode: string): Promise<void> {
    const knex = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex.raw(
      `UPDATE customer_voucher SET used_at = now() WHERE customer_id = ? AND promotion_code = ? AND used_at IS NULL`,
      [customerId, promotionCode]
    )
  }

  private formatPromotion(
    p: any,
    collected?: CustomerVoucher
  ): PromotionWithVoucher {
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

    // Determine min order from rules
    let min_order: number | undefined
    const subtotalRule = p.rules?.find((r: any) => r.attribute === "subtotal")
    if (subtotalRule?.values?.[0]) {
      min_order = Number(subtotalRule.values[0]) / 100
    }

    // Determine scope from metadata
    const isSellerScoped = p.metadata?.seller_id || p.metadata?.scope === "seller"

    return {
      id: p.id,
      code: p.code,
      type: p.type,
      status: p.status,
      description: p.metadata?.description || undefined,
      discount_label,
      min_order,
      scope: isSellerScoped ? "seller" : "platform",
      seller_id: p.metadata?.seller_id,
      seller_name: p.metadata?.seller_name,
      expires_at: p.ends_at || null,
      is_collected: !!collected,
      collected_voucher_id: collected?.id,
      metadata: p.metadata,
    }
  }
}
