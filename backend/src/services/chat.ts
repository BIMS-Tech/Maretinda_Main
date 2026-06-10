import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Response } from "express"
import crypto from "crypto"

export interface ChatConversation {
  id: string
  type: string
  seller_id: string | null
  customer_id: string | null
  subject: string | null
  status: string
  last_message_at: string | null
  unread_seller: number
  unread_customer: number
  unread_admin: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: string
  sender_name: string
  body: string
  read_at: string | null
  created_at: string
}

type SenderRole = "seller" | "customer" | "admin"

// ─── Module-level singleton ────────────────────────────────────────────────────

let _instance: ChatService | null = null

export function initChatService(container: MedusaContainer): void {
  if (!_instance) {
    _instance = new ChatService(container)
  }
}

/**
 * Returns the ChatService singleton. Accepts an optional container so the
 * first caller (a route handler) can self-initialise without a loader.
 */
export function getChatService(container?: MedusaContainer): ChatService {
  if (!_instance) {
    if (!container) {
      throw new Error("ChatService not yet initialised — pass req.scope on first call")
    }
    initChatService(container)
  }
  return _instance!
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ChatService {
  private connections: Map<string, Set<Response>> = new Map()
  private knex: any

  constructor(container: MedusaContainer) {
    this.knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  }

  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`
  }

  // ─── SSE Connection Management ────────────────────────────────────────

  addConnection(userId: string, res: Response): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(res)
  }

  removeConnection(userId: string, res: Response): void {
    const set = this.connections.get(userId)
    if (set) {
      set.delete(res)
      if (set.size === 0) this.connections.delete(userId)
    }
  }

  pushEvent(userId: string, event: string, data: unknown): void {
    const resSet = this.connections.get(userId)
    if (!resSet || resSet.size === 0) return
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of resSet) {
      try {
        res.write(payload)
      } catch {
        // client disconnected mid-write
      }
    }
  }

  // ─── Conversations ────────────────────────────────────────────────────

  async getConversations(filters: {
    seller_id?: string
    customer_id?: string
    is_admin?: boolean
    limit?: number
    offset?: number
  }): Promise<{ conversations: ChatConversation[]; count: number }> {
    const { limit = 30, offset = 0, is_admin } = filters

    try {
      // Base query without ordering — used for COUNT (ORDER BY is invalid on aggregates)
      let base = this.knex("chat_conversation")

      if (!is_admin) {
        if (filters.seller_id) base = base.where("seller_id", filters.seller_id)
        if (filters.customer_id) base = base.where("customer_id", filters.customer_id)
      }

      const countResult = await base.clone().count("chat_conversation.id as count")
      const rows = await base.clone()
        .select(
          "chat_conversation.*",
          this.knex.raw(`COALESCE(s.name, 'seller') as seller_name`),
          this.knex.raw(`COALESCE(NULLIF(TRIM(CONCAT(c.first_name, ' ', c.last_name)), ''), c.email, 'Customer') as customer_name`)
        )
        .leftJoin("seller as s", "s.id", "chat_conversation.seller_id")
        .leftJoin("customer as c", "c.id", "chat_conversation.customer_id")
        .orderByRaw("chat_conversation.last_message_at desc nulls last")
        .orderBy("chat_conversation.created_at", "desc")
        .limit(limit)
        .offset(offset)

      return { conversations: rows, count: Number(countResult[0]?.count ?? 0) }
    } catch (err: any) {
      if (err?.code === "42P01") return { conversations: [], count: 0 }
      throw err
    }
  }

  async getConversation(id: string): Promise<ChatConversation | null> {
    try {
      const row = await this.knex("chat_conversation").where("id", id).first()
      return row || null
    } catch (err: any) {
      if (err?.code === "42P01") return null
      throw err
    }
  }

  async getOrCreateConversation(
    sellerId: string,
    customerId: string,
    subject?: string
  ): Promise<ChatConversation> {
    const existing = await this.knex("chat_conversation")
      .where("seller_id", sellerId)
      .where("customer_id", customerId)
      .where("status", "open")
      .first()

    if (existing) return existing

    const [row] = await this.knex("chat_conversation")
      .insert({
        id: this.generateId("chatconv"),
        type: "seller_customer",
        seller_id: sellerId,
        customer_id: customerId,
        subject: subject || null,
        status: "open",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")

    this.pushEvent(sellerId, "new_conversation", row)
    this.pushEvent("__admin__", "new_conversation", row)

    return row
  }

  async createAdminConversation(params: {
    seller_id?: string
    customer_id?: string
    subject?: string
    type: string
  }): Promise<ChatConversation> {
    const [row] = await this.knex("chat_conversation")
      .insert({
        id: this.generateId("chatconv"),
        type: params.type,
        seller_id: params.seller_id || null,
        customer_id: params.customer_id || null,
        subject: params.subject || null,
        status: "open",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")

    if (params.seller_id) this.pushEvent(params.seller_id, "new_conversation", row)
    if (params.customer_id) this.pushEvent(params.customer_id, "new_conversation", row)

    return row
  }

  async closeConversation(id: string): Promise<void> {
    await this.knex("chat_conversation")
      .where("id", id)
      .update({ status: "closed", updated_at: new Date() })
  }

  // ─── Messages ─────────────────────────────────────────────────────────

  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<{ messages: ChatMessage[]; count: number }> {
    try {
      const countResult = await this.knex("chat_message")
        .where("conversation_id", conversationId)
        .count("id as count")

      const rows = await this.knex("chat_message")
        .where("conversation_id", conversationId)
        .orderBy("created_at", "asc")
        .limit(limit)
        .offset(offset)

      return { messages: rows, count: Number(countResult[0]?.count ?? 0) }
    } catch (err: any) {
      if (err?.code === "42P01") return { messages: [], count: 0 }
      throw err
    }
  }

  async sendMessage(params: {
    conversation_id: string
    sender_id: string
    sender_role: SenderRole
    sender_name: string
    body: string
  }): Promise<ChatMessage> {
    const { conversation_id, sender_id, sender_role, sender_name, body } = params

    const conv = await this.getConversation(conversation_id)
    if (!conv) throw new Error("Conversation not found")

    const [msg] = await this.knex("chat_message")
      .insert({
        id: this.generateId("chatmsg"),
        conversation_id,
        sender_id,
        sender_role,
        sender_name,
        body,
        created_at: new Date(),
      })
      .returning("*")

    const unreadUpdates: Record<string, unknown> = {
      last_message_at: new Date(),
      updated_at: new Date(),
    }
    if (sender_role !== "seller") unreadUpdates.unread_seller = this.knex.raw("unread_seller + 1")
    if (sender_role !== "customer") unreadUpdates.unread_customer = this.knex.raw("unread_customer + 1")
    if (sender_role !== "admin") unreadUpdates.unread_admin = this.knex.raw("unread_admin + 1")

    await this.knex("chat_conversation").where("id", conversation_id).update(unreadUpdates)

    const eventPayload = { ...msg, conversation_id }
    if (conv.seller_id && sender_role !== "seller") {
      this.pushEvent(conv.seller_id, "new_message", eventPayload)
    }
    if (conv.customer_id && sender_role !== "customer") {
      this.pushEvent(conv.customer_id, "new_message", eventPayload)
    }
    if (sender_role !== "admin") {
      this.pushEvent("__admin__", "new_message", eventPayload)
    }

    return msg
  }

  async markRead(conversationId: string, role: SenderRole): Promise<void> {
    const field =
      role === "seller"
        ? "unread_seller"
        : role === "customer"
        ? "unread_customer"
        : "unread_admin"

    await this.knex("chat_conversation")
      .where("id", conversationId)
      .update({ [field]: 0, updated_at: new Date() })
  }

  // ─── Utility lookups ──────────────────────────────────────────────────

  async getsellersellerId(memberId: string): Promise<string | null> {
    try {
      const result = await this.knex.raw(
        `SELECT seller_id FROM member WHERE id = ? LIMIT 1`,
        [memberId]
      )
      return result.rows?.[0]?.seller_id || null
    } catch {
      return null
    }
  }

  async getsellerName(sellerId: string): Promise<string> {
    try {
      const result = await this.knex.raw(
        `SELECT name FROM seller WHERE id = ? LIMIT 1`,
        [sellerId]
      )
      return result.rows?.[0]?.name || "seller"
    } catch {
      return "seller"
    }
  }

  async getCustomerName(customerId: string): Promise<string> {
    try {
      const result = await this.knex.raw(
        `SELECT first_name, last_name FROM customer WHERE id = ? LIMIT 1`,
        [customerId]
      )
      const c = result.rows?.[0]
      if (!c) return "Customer"
      return `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer"
    } catch {
      return "Customer"
    }
  }

  async getTotalUnreadAdmin(): Promise<number> {
    try {
      const result = await this.knex("chat_conversation")
        .sum("unread_admin as total")
        .where("status", "open")
      return Number(result[0]?.total ?? 0)
    } catch {
      return 0
    }
  }

  async getTotalUnreadseller(sellerId: string): Promise<number> {
    try {
      const result = await this.knex("chat_conversation")
        .sum("unread_seller as total")
        .where("seller_id", sellerId)
        .where("status", "open")
      return Number(result[0]?.total ?? 0)
    } catch {
      return 0
    }
  }

  async getTotalUnreadCustomer(customerId: string): Promise<number> {
    try {
      const result = await this.knex("chat_conversation")
        .sum("unread_customer as total")
        .where("customer_id", customerId)
        .where("status", "open")
      return Number(result[0]?.total ?? 0)
    } catch {
      return 0
    }
  }
}

export default ChatService
