import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"

export interface SellerReel {
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
}

export type ReelStatus = "draft" | "published" | "archived"

export const REEL_STATUSES: ReelStatus[] = ["draft", "published", "archived"]

// ─── Module-level singleton ────────────────────────────────────────────────────

let _instance: ReelsService | null = null

export function initReelsService(container: MedusaContainer): void {
  if (!_instance) {
    _instance = new ReelsService(container)
  }
}

/**
 * Returns the ReelsService singleton. Accepts an optional container so the
 * first caller (a route handler) can self-initialise without a loader — same
 * pattern as ChatService.
 */
export function getReelsService(container?: MedusaContainer): ReelsService {
  if (!_instance) {
    if (!container) {
      throw new Error("ReelsService not yet initialised — pass req.scope on first call")
    }
    initReelsService(container)
  }
  return _instance!
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ReelsService {
  private knex: any

  constructor(container: MedusaContainer) {
    this.knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  }

  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`
  }

  /**
   * Reels are returned with the seller's public identity attached so the
   * storefront can render the author strip (and open a chat) without a second
   * round-trip.
   */
  private reelSelect() {
    return this.knex("seller_reel")
      .whereNull("seller_reel.deleted_at")
      .leftJoin("seller as s", "s.id", "seller_reel.seller_id")
      .select(
        "seller_reel.*",
        this.knex.raw(`COALESCE(s.name, 'Seller') as seller_name`),
        this.knex.raw(`s.handle as seller_handle`),
        this.knex.raw(`s.photo as seller_photo`)
      )
  }

  private normalize(row: any): any {
    if (!row) return row
    return {
      ...row,
      product_ids: Array.isArray(row.product_ids) ? row.product_ids : [],
    }
  }

  // ─── Reels ────────────────────────────────────────────────────────────

  async listReels(filters: {
    seller_id?: string
    status?: ReelStatus | ReelStatus[]
    limit?: number
    offset?: number
    /** When set, each reel gets a `liked` flag for this customer. */
    viewer_id?: string
  }): Promise<{ reels: any[]; count: number }> {
    const { limit = 20, offset = 0 } = filters

    let base = this.knex("seller_reel").whereNull("seller_reel.deleted_at")
    if (filters.seller_id) base = base.where("seller_reel.seller_id", filters.seller_id)
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      base = base.whereIn("seller_reel.status", statuses)
    }

    const countRow = await base.clone().count("seller_reel.id as total").first()
    const count = parseInt(countRow?.total || "0", 10)

    let query = this.reelSelect()
    if (filters.seller_id) query = query.where("seller_reel.seller_id", filters.seller_id)
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      query = query.whereIn("seller_reel.status", statuses)
    }

    const rows = await query
      .orderByRaw(`COALESCE("seller_reel"."published_at", "seller_reel"."created_at") DESC`)
      .limit(limit)
      .offset(offset)

    const reels = rows.map((r: any) => this.normalize(r))

    if (filters.viewer_id && reels.length) {
      const liked = await this.knex("seller_reel_like")
        .where("customer_id", filters.viewer_id)
        .whereIn(
          "reel_id",
          reels.map((r: any) => r.id)
        )
        .select("reel_id")
      const likedSet = new Set(liked.map((l: any) => l.reel_id))
      for (const reel of reels) reel.liked = likedSet.has(reel.id)
    }

    return { reels, count }
  }

  async getReel(id: string, viewerId?: string): Promise<any | null> {
    const row = await this.reelSelect().where("seller_reel.id", id).first()
    if (!row) return null

    const reel = this.normalize(row)

    if (viewerId) {
      const like = await this.knex("seller_reel_like")
        .where({ reel_id: id, customer_id: viewerId })
        .first()
      reel.liked = !!like
    }

    return reel
  }

  async createReel(input: {
    seller_id: string
    title?: string
    description?: string | null
    video_url: string
    thumbnail_url?: string | null
    duration?: number | null
    product_ids?: string[]
    status?: ReelStatus
  }): Promise<any> {
    const status: ReelStatus = REEL_STATUSES.includes(input.status as ReelStatus)
      ? (input.status as ReelStatus)
      : "published"

    const [row] = await this.knex("seller_reel")
      .insert({
        id: this.generateId("reel"),
        seller_id: input.seller_id,
        title: (input.title || "").slice(0, 200),
        description: input.description || null,
        video_url: input.video_url,
        thumbnail_url: input.thumbnail_url || null,
        duration: input.duration ?? null,
        product_ids: JSON.stringify(input.product_ids || []),
        status,
        published_at: status === "published" ? this.knex.fn.now() : null,
      })
      .returning("*")

    return this.normalize(row)
  }

  async updateReel(
    id: string,
    sellerId: string,
    input: {
      title?: string
      description?: string | null
      video_url?: string
      thumbnail_url?: string | null
      duration?: number | null
      product_ids?: string[]
      status?: ReelStatus
    }
  ): Promise<any | null> {
    const existing = await this.knex("seller_reel")
      .where({ id, seller_id: sellerId })
      .whereNull("deleted_at")
      .first()
    if (!existing) return null

    const patch: Record<string, any> = { updated_at: this.knex.fn.now() }
    if (input.title !== undefined) patch.title = (input.title || "").slice(0, 200)
    if (input.description !== undefined) patch.description = input.description || null
    if (input.video_url !== undefined) patch.video_url = input.video_url
    if (input.thumbnail_url !== undefined) patch.thumbnail_url = input.thumbnail_url || null
    if (input.duration !== undefined) patch.duration = input.duration ?? null
    if (input.product_ids !== undefined) patch.product_ids = JSON.stringify(input.product_ids || [])

    if (input.status !== undefined && REEL_STATUSES.includes(input.status)) {
      patch.status = input.status
      // First transition to published stamps published_at; later edits keep it.
      if (input.status === "published" && !existing.published_at) {
        patch.published_at = this.knex.fn.now()
      }
    }

    const [row] = await this.knex("seller_reel").where({ id }).update(patch).returning("*")
    return this.normalize(row)
  }

  async deleteReel(id: string, sellerId: string): Promise<boolean> {
    const affected = await this.knex("seller_reel")
      .where({ id, seller_id: sellerId })
      .whereNull("deleted_at")
      .update({ deleted_at: this.knex.fn.now(), updated_at: this.knex.fn.now() })
    return affected > 0
  }

  /** Best-effort view counter — never blocks playback. */
  async incrementView(id: string): Promise<void> {
    await this.knex("seller_reel")
      .where({ id })
      .whereNull("deleted_at")
      .update({ view_count: this.knex.raw("view_count + 1") })
  }

  // ─── Likes ────────────────────────────────────────────────────────────

  /**
   * Toggles the like for a customer and returns the resulting state. The
   * counter is recomputed from the like rows so it can't drift on double taps.
   */
  async toggleLike(
    reelId: string,
    customerId: string
  ): Promise<{ liked: boolean; like_count: number }> {
    const existing = await this.knex("seller_reel_like")
      .where({ reel_id: reelId, customer_id: customerId })
      .first()

    if (existing) {
      await this.knex("seller_reel_like").where({ reel_id: reelId, customer_id: customerId }).del()
    } else {
      await this.knex("seller_reel_like")
        .insert({ reel_id: reelId, customer_id: customerId })
        .onConflict(["reel_id", "customer_id"])
        .ignore()
    }

    const like_count = await this.syncLikeCount(reelId)
    return { liked: !existing, like_count }
  }

  private async syncLikeCount(reelId: string): Promise<number> {
    const row = await this.knex("seller_reel_like").where("reel_id", reelId).count("* as total").first()
    const total = parseInt(row?.total || "0", 10)
    await this.knex("seller_reel").where({ id: reelId }).update({ like_count: total })
    return total
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  async getSellerIdFromMember(memberId: string): Promise<string | null> {
    const result = await this.knex.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
    return result.rows?.[0]?.seller_id || null
  }

  /** Reel ids owned by a seller — used to scope vendor-side lookups. */
  async ownsReel(reelId: string, sellerId: string): Promise<boolean> {
    const row = await this.knex("seller_reel")
      .where({ id: reelId, seller_id: sellerId })
      .whereNull("deleted_at")
      .first()
    return !!row
  }
}
