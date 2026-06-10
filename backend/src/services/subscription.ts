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
    return db("seller_subscription")
      .where("seller_id", sellerId)
      .where("status", "active")
      .orderBy("created_at", "desc")
      .first()
  }

  async getSubscriptionStatus(sellerId: string): Promise<{
    has_subscription: boolean
    subscription: any | null
    plan: any | null
  }> {
    const subscription = await this.getActiveSubscription(sellerId)
    if (!subscription) {
      return { has_subscription: false, subscription: null, plan: null }
    }
    const plan = await this.getPlanByName(subscription.plan_name)
    return { has_subscription: true, subscription, plan }
  }

  // Admin: list all subscriptions with optional filters
  async listAll(filters?: { status?: string; seller_id?: string; limit?: number; offset?: number }): Promise<{
    subscriptions: any[]
    count: number
  }> {
    const db = this.getDb()
    const limit = filters?.limit ?? 50
    const offset = filters?.offset ?? 0

    // Build a base query without ORDER BY so the count clone doesn't carry it
    // (PostgreSQL requires ORDER BY columns to appear in GROUP BY for aggregate queries)
    let baseQuery = db("seller_subscription")
    if (filters?.status) baseQuery = baseQuery.where("status", filters.status)
    if (filters?.seller_id) baseQuery = baseQuery.where("seller_id", filters.seller_id)

    const [subscriptions, countResult] = await Promise.all([
      baseQuery.clone().orderBy("created_at", "desc").limit(limit).offset(offset),
      baseQuery.clone().count("id as count"),
    ])

    return { subscriptions, count: Number((countResult as any)[0]?.count ?? 0) }
  }

  // Admin: manually assign a plan (e.g. complimentary access); sets end_date since GiyaPay won't manage it
  async adminAssign(sellerId: string, planName: string, durationDays: number = 30): Promise<any> {
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
        price: plan.price,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        auto_renew: false,
        payment_reference: "admin_assigned",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")

    return subscription
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

  async updatePlan(planId: string, data: Partial<{ name: string; price: number; yearly_price: number; features: Record<string, unknown>; status: string }>): Promise<any> {
    const db = this.getDb()
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.price !== undefined) updateData.price = data.price
    if (data.yearly_price !== undefined) updateData.yearly_price = data.yearly_price
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

    // Cancel any existing active subscription
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
