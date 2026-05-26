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

  async getActiveSubscription(vendorId: string): Promise<any | null> {
    const db = this.getDb()
    return db("vendor_subscription")
      .where("vendor_id", vendorId)
      .where("status", "active")
      .orderBy("created_at", "desc")
      .first()
  }

  async getSubscriptionStatus(vendorId: string): Promise<{
    has_subscription: boolean
    subscription: any | null
    plan: any | null
  }> {
    const subscription = await this.getActiveSubscription(vendorId)
    if (!subscription) {
      return { has_subscription: false, subscription: null, plan: null }
    }
    const plan = await this.getPlanByName(subscription.plan_name)
    return { has_subscription: true, subscription, plan }
  }

  // Admin: list all subscriptions with optional filters
  async listAll(filters?: { status?: string; vendor_id?: string; limit?: number; offset?: number }): Promise<{
    subscriptions: any[]
    count: number
  }> {
    const db = this.getDb()
    const limit = filters?.limit ?? 50
    const offset = filters?.offset ?? 0

    let query = db("vendor_subscription").orderBy("created_at", "desc")
    if (filters?.status) query = query.where("status", filters.status)
    if (filters?.vendor_id) query = query.where("vendor_id", filters.vendor_id)

    const [subscriptions, [{ count }]] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().count("id as count"),
    ])

    return { subscriptions, count: Number(count) }
  }

  // Admin: manually assign a plan (e.g. complimentary access); sets end_date since GiyaPay won't manage it
  async adminAssign(vendorId: string, planName: string, durationDays: number = 30): Promise<any> {
    const db = this.getDb()

    const plan = await this.getPlanByName(planName)
    if (!plan) throw new Error(`Plan "${planName}" not found.`)

    await db("vendor_subscription")
      .where("vendor_id", vendorId)
      .where("status", "active")
      .update({ status: "cancelled", updated_at: new Date() })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + durationDays)

    const [subscription] = await db("vendor_subscription")
      .insert({
        id: generateId("vsub"),
        vendor_id: vendorId,
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
    const [updated] = await db("vendor_subscription")
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
    const [updated] = await db("vendor_subscription")
      .where("id", subscriptionId)
      .update({ status, updated_at: new Date() })
      .returning("*")
    if (!updated) throw new Error(`Subscription "${subscriptionId}" not found.`)
    return updated
  }

  async renewSubscription(params: {
    vendorId: string
    planName: string
    billingPeriod: "monthly" | "yearly"
    price: number
    paymentReference: string
    planId?: string
  }): Promise<any> {
    const db = this.getDb()

    // Cancel any existing active subscription
    await db("vendor_subscription")
      .where("vendor_id", params.vendorId)
      .where("status", "active")
      .update({ status: "cancelled", updated_at: new Date() })

    const startDate = new Date()
    const endDate = new Date(startDate)
    if (params.billingPeriod === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else {
      endDate.setMonth(endDate.getMonth() + 1)
    }

    const [subscription] = await db("vendor_subscription")
      .insert({
        id: generateId("vsub"),
        vendor_id: params.vendorId,
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
