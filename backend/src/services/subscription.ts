import { randomBytes } from "crypto"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`
}

class SubscriptionService {
  private container: any

  constructor(container: any) {
    this.container = container
  }

  private getDb(): any {
    try {
      return this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      return (this.container as any).__pg_connection__ || (this.container as any).pgConnection
    }
  }

  async getPlans(): Promise<any[]> {
    const db = this.getDb()
    return db("subscription_plan").where("status", "active").orderBy("price", "asc")
  }

  async getPlanByName(name: string): Promise<any | null> {
    const db = this.getDb()
    return db("subscription_plan").where("name", name).where("status", "active").first()
  }

  async getActiveSubscription(sellerId: string): Promise<any | null> {
    const db = this.getDb()
    // "active" means status active AND not past its end date. Without the
    // end_date guard an expired subscription/trial would keep granting access
    // until the hourly expiry job runs.
    return db("seller_subscription")
      .where("seller_id", sellerId)
      .where("status", "active")
      .where("end_date", ">", new Date())
      .orderBy("created_at", "desc")
      .first()
  }

  // Flip any active-but-overdue subscriptions/trials to "expired". Run on a
  // schedule so that direct `status = 'active'` reads elsewhere stay correct.
  async expireOverdue(): Promise<number> {
    const db = this.getDb()
    const updated = await db("seller_subscription")
      .where("status", "active")
      .where("end_date", "<", new Date())
      .update({ status: "expired", updated_at: new Date() })
    return Number(updated || 0)
  }

  // Idempotent DB guards. Safe to call repeatedly (CREATE ... IF NOT EXISTS).
  async initConstraints(): Promise<void> {
    const db = this.getDb()
    // At most one trial row per seller — atomically blocks double-trial races
    // that the hasEverSubscribed() check alone can't (read-then-insert).
    try {
      await db.raw(
        `CREATE UNIQUE INDEX IF NOT EXISTS seller_subscription_one_trial
         ON seller_subscription (seller_id) WHERE is_trial = true`
      )
    } catch (e) {
      console.error("[Subscription] initConstraints (one_trial) failed:", e)
    }
  }

  async hasEverSubscribed(sellerId: string): Promise<boolean> {
    const db = this.getDb()
    const row = await db("seller_subscription")
      .where("seller_id", sellerId)
      .count("id as count")
      .first()
    return Number(row?.count ?? 0) > 0
  }

  async getSubscriptionStatus(sellerId: string): Promise<{
    has_subscription: boolean
    has_ever_subscribed: boolean
    subscription: any | null
    plan: any | null
  }> {
    const [subscription, hasEver] = await Promise.all([
      this.getActiveSubscription(sellerId),
      this.hasEverSubscribed(sellerId),
    ])

    if (!subscription) {
      return { has_subscription: false, has_ever_subscribed: hasEver, subscription: null, plan: null }
    }

    const plan = await this.getPlanByName(subscription.plan_name)
    return { has_subscription: true, has_ever_subscribed: hasEver, subscription, plan }
  }

  // Admin: list all subscriptions with optional filters
  async listAll(filters?: { status?: string; seller_id?: string; limit?: number; offset?: number }): Promise<{
    subscriptions: any[]
    count: number
  }> {
    const db = this.getDb()
    const limit = filters?.limit ?? 50
    const offset = filters?.offset ?? 0

    let baseQuery = db("seller_subscription")
    if (filters?.status) baseQuery = baseQuery.where("status", filters.status)
    if (filters?.seller_id) baseQuery = baseQuery.where("seller_id", filters.seller_id)

    const [subscriptions, countResult] = await Promise.all([
      baseQuery.clone().orderBy("created_at", "desc").limit(limit).offset(offset),
      baseQuery.clone().count("id as count"),
    ])

    return { subscriptions, count: Number((countResult as any)[0]?.count ?? 0) }
  }

  // Vendor: start a free trial (first-time only)
  async startTrial(sellerId: string, planName: string): Promise<any> {
    const db = this.getDb()

    await this.initConstraints()

    const alreadyUsed = await this.hasEverSubscribed(sellerId)
    if (alreadyUsed) throw new Error("Trial has already been used for this account.")

    const plan = await this.getPlanByName(planName)
    if (!plan) throw new Error(`Plan "${planName}" not found.`)
    if (!plan.trial_days || plan.trial_days <= 0) throw new Error(`Plan "${planName}" does not offer a free trial.`)

    const startDate = new Date()
    const trialEnd = new Date(startDate)
    trialEnd.setDate(trialEnd.getDate() + plan.trial_days)

    try {
      const [subscription] = await db("seller_subscription")
        .insert({
          id: generateId("vsub"),
          seller_id: sellerId,
          plan_id: plan.id,
          plan_name: plan.name,
          price: 0,
          billing_period: "monthly",
          start_date: startDate,
          end_date: trialEnd,
          trial_ends_at: trialEnd,
          is_trial: true,
          status: "active",
          auto_renew: false,
          payment_reference: "trial",
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*")

      return subscription
    } catch (e: any) {
      // Unique-violation on the one-trial-per-seller index => concurrent/double
      // trial attempt. Surface the same friendly message.
      if (e?.code === "23505") {
        throw new Error("Trial has already been used for this account.")
      }
      throw e
    }
  }

  // Admin: manually assign a plan (complimentary or trial)
  async adminAssign(
    sellerId: string,
    planName: string,
    durationDays: number = 30,
    isTrial: boolean = false
  ): Promise<any> {
    const db = this.getDb()

    const plan = await this.getPlanByName(planName)
    if (!plan) throw new Error(`Plan "${planName}" not found.`)

    await db("seller_subscription")
      .where("seller_id", sellerId)
      .where("status", "active")
      .update({ status: "cancelled", updated_at: new Date() })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + durationDays)

    const [subscription] = await db("seller_subscription")
      .insert({
        id: generateId("vsub"),
        seller_id: sellerId,
        plan_name: plan.name,
        price: isTrial ? 0 : plan.price,
        billing_period: "monthly",
        start_date: startDate,
        end_date: endDate,
        is_trial: isTrial,
        trial_ends_at: isTrial ? endDate : null,
        status: "active",
        auto_renew: false,
        payment_reference: isTrial ? "admin_trial" : "admin_assigned",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")

    return subscription
  }

  // Admin: end a trial immediately
  async adminEndTrial(subscriptionId: string): Promise<any> {
    const db = this.getDb()
    const sub = await db("seller_subscription").where("id", subscriptionId).first()
    if (!sub) throw new Error(`Subscription "${subscriptionId}" not found.`)
    if (!sub.is_trial) throw new Error("Subscription is not a trial.")

    const [updated] = await db("seller_subscription")
      .where("id", subscriptionId)
      .update({ status: "expired", end_date: new Date(), trial_ends_at: new Date(), updated_at: new Date() })
      .returning("*")

    return updated
  }

  // Admin: extend a trial by N days
  async adminExtendTrial(subscriptionId: string, days: number): Promise<any> {
    const db = this.getDb()
    const sub = await db("seller_subscription").where("id", subscriptionId).first()
    if (!sub) throw new Error(`Subscription "${subscriptionId}" not found.`)
    if (!sub.is_trial) throw new Error("Subscription is not a trial.")

    const currentEnd = new Date(sub.trial_ends_at || sub.end_date)
    const newEnd = new Date(currentEnd)
    newEnd.setDate(newEnd.getDate() + days)

    const [updated] = await db("seller_subscription")
      .where("id", subscriptionId)
      .update({ end_date: newEnd, trial_ends_at: newEnd, updated_at: new Date() })
      .returning("*")

    return updated
  }

  async adminDeactivate(subscriptionId: string): Promise<any> {
    const db = this.getDb()
    const [updated] = await db("seller_subscription")
      .where("id", subscriptionId)
      .update({ status: "cancelled", updated_at: new Date() })
      .returning("*")
    if (!updated) throw new Error(`Subscription "${subscriptionId}" not found.`)
    return updated
  }

  async createPlan(data: { name: string; price: number; features?: Record<string, unknown> }): Promise<any> {
    const db = this.getDb()
    const existing = await db("subscription_plan").where("name", data.name).first()
    if (existing) throw new Error(`A plan named "${data.name}" already exists.`)

    const [plan] = await db("subscription_plan")
      .insert({
        id: `subplan_${data.name.toLowerCase().replace(/\s+/g, "_")}`,
        name: data.name,
        price: data.price,
        features: data.features ? JSON.stringify(data.features) : null,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")

    return plan
  }

  async updatePlan(
    planId: string,
    data: Partial<{
      name: string
      price: number
      yearly_price: number
      yearly_discount_percent: number
      trial_days: number
      features: Record<string, unknown>
      status: string
    }>
  ): Promise<any> {
    const db = this.getDb()
    const updateData: Record<string, unknown> = { updated_at: new Date() }

    if (data.name !== undefined) updateData.name = data.name
    if (data.price !== undefined) updateData.price = data.price
    if (data.yearly_price !== undefined) updateData.yearly_price = data.yearly_price
    if (data.yearly_discount_percent !== undefined) updateData.yearly_discount_percent = data.yearly_discount_percent
    if (data.trial_days !== undefined) updateData.trial_days = data.trial_days
    if (data.features !== undefined) updateData.features = JSON.stringify(data.features)
    if (data.status !== undefined) updateData.status = data.status

    const [updated] = await db("subscription_plan").where("id", planId).update(updateData).returning("*")
    if (!updated) throw new Error(`Plan "${planId}" not found.`)
    return updated
  }

  async setStatus(subscriptionId: string, status: "active" | "cancelled"): Promise<any> {
    const db = this.getDb()
    const [updated] = await db("seller_subscription")
      .where("id", subscriptionId)
      .update({ status, updated_at: new Date() })
      .returning("*")
    if (!updated) throw new Error(`Subscription "${subscriptionId}" not found.`)
    return updated
  }

  async renewSubscription(params: {
    sellerId: string
    planName: string
    billingPeriod: "monthly" | "yearly"
    price: number
    paymentReference: string
    planId?: string
  }): Promise<any> {
    const db = this.getDb()

    await db("seller_subscription")
      .where("seller_id", params.sellerId)
      .where("status", "active")
      .update({ status: "cancelled", updated_at: new Date() })

    const startDate = new Date()
    const endDate = new Date(startDate)
    if (params.billingPeriod === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    const [subscription] = await db("seller_subscription")
      .insert({
        id: generateId("vsub"),
        seller_id: params.sellerId,
        plan_id: params.planId || null,
        plan_name: params.planName,
        price: params.price,
        billing_period: params.billingPeriod,
        start_date: startDate,
        end_date: endDate,
        is_trial: false,
        trial_ends_at: null,
        status: "active",
        auto_renew: false,
        payment_reference: params.paymentReference,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")

    return subscription
  }
}

export default SubscriptionService
