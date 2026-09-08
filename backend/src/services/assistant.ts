import Anthropic from "@anthropic-ai/sdk"
import { randomBytes } from "crypto"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"
import { embedQuery, toVectorLiteral } from "../lib/voyage"

/**
 * RAG support assistant.
 *
 * Retrieval is pgvector over `assistant_document` (built by
 * `npm run assistant:index`). Generation is Claude, with three tools:
 *
 *   search_help_center — follow-up retrieval when the pre-fetched context misses
 *   get_my_orders      — the signed-in customer's own orders, never anyone else's
 *   search_products    — live catalogue lookup
 *
 * Every user turn is pre-retrieved before the first model call, so the common
 * "what's your return policy" question is answered in one round trip; the tool
 * exists for the cases where the model needs to look something else up.
 */

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-4-8"
const MAX_TOOL_ITERATIONS = 4
const RETRIEVAL_LIMIT = 6
/** Cosine distance above this means "nothing relevant" — pgvector <=> returns 0 (identical) to 2. */
const MAX_DISTANCE = 0.75

export type AssistantMessage = { role: "user" | "assistant"; content: string }

export type RetrievedChunk = {
  id: string
  source: string
  title: string
  section: string | null
  url: string | null
  content: string
  distance: number
}

let _instance: AssistantService | null = null

export function getAssistantService(container: any): AssistantService {
  if (!_instance) _instance = new AssistantService(container)
  return _instance
}

export class AssistantService {
  private container: any
  private client: Anthropic | null = null

  constructor(container: any) {
    this.container = container
  }

  private getDb(): any {
    return this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set — the assistant cannot answer")
      }
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
    return this.client
  }

  // ─── Retrieval ──────────────────────────────────────────────────────────────

  async retrieve(question: string, limit = RETRIEVAL_LIMIT): Promise<RetrievedChunk[]> {
    const vector = await embedQuery(question)
    const db = this.getDb()

    // `<=>` is pgvector's cosine distance operator and is what the HNSW index
    // built with vector_cosine_ops accelerates. Using a different operator here
    // silently falls back to a sequential scan.
    const { rows } = await db.raw(
      `SELECT id, source, title, section, url, content,
              embedding <=> ?::vector AS distance
         FROM assistant_document
        ORDER BY embedding <=> ?::vector
        LIMIT ?`,
      [toVectorLiteral(vector), toVectorLiteral(vector), limit]
    )

    return (rows as RetrievedChunk[]).filter((r) => Number(r.distance) <= MAX_DISTANCE)
  }

  private formatContext(chunks: RetrievedChunk[]): string {
    if (!chunks.length) {
      return "No matching help-centre content was found for this question."
    }
    return chunks
      .map(
        (c, i) =>
          `<doc index="${i + 1}" title="${c.title}${c.section ? ` — ${c.section}` : ""}"${
            c.url ? ` url="${c.url}"` : ""
          }>\n${c.content}\n</doc>`
      )
      .join("\n\n")
  }

  // ─── Tools ──────────────────────────────────────────────────────────────────

  private buildTools(customerId: string | null): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = [
      {
        name: "search_help_center",
        description:
          "Search Maretinda's help centre, policies, and seller documentation. " +
          "Call this when the context already provided does not answer the question, " +
          "or when the customer asks about a second, unrelated topic in a follow-up.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The search phrase, written as the customer would describe the problem.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "search_products",
        description:
          "Search the live Maretinda product catalogue by keyword. Call this when the " +
          "customer is looking for something to buy, asks whether an item is available, " +
          "or asks what a product costs. Returns real products with links.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Product keywords, e.g. 'wireless earbuds' or 'rice cooker'.",
            },
            limit: {
              type: "integer",
              description: "How many products to return, 1-8. Defaults to 5.",
            },
          },
          required: ["query"],
        },
      },
    ]

    // The orders tool is only offered when there is a session to scope it to.
    // An anonymous visitor must not even see that it exists, so the model never
    // promises a lookup it cannot perform.
    if (customerId) {
      tools.push({
        name: "get_my_orders",
        description:
          "Look up the signed-in customer's own recent orders, including status, " +
          "tracking numbers, and totals. Call this for questions like 'where is my order', " +
          "'has my order shipped', or 'what did I order last week'.",
        input_schema: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "How many recent orders to return, 1-10. Defaults to 5.",
            },
            order_number: {
              type: "string",
              description:
                "Optional. A specific order number the customer mentioned, to filter to that order.",
            },
          },
          required: [],
        },
      })
    }

    return tools
  }

  private async runTool(
    name: string,
    input: any,
    customerId: string | null
  ): Promise<{ result: string; chunks?: RetrievedChunk[] }> {
    switch (name) {
      case "search_help_center": {
        const chunks = await this.retrieve(String(input?.query || ""))
        return { result: this.formatContext(chunks), chunks }
      }
      case "search_products":
        return { result: await this.searchProducts(String(input?.query || ""), input?.limit) }
      case "get_my_orders":
        // Re-check the session here rather than trusting that the tool was only
        // exposed when authenticated — this is the actual authorisation boundary.
        if (!customerId) {
          return { result: "The customer is not signed in, so their orders cannot be looked up." }
        }
        return {
          result: await this.getCustomerOrders(customerId, input?.limit, input?.order_number),
        }
      default:
        return { result: `Unknown tool: ${name}` }
    }
  }

  private async searchProducts(query: string, limit?: number): Promise<string> {
    const take = Math.min(Math.max(Number(limit) || 5, 1), 8)
    const graph = this.container.resolve(ContainerRegistrationKeys.QUERY)

    // Prices need a region/currency context. If the default region can't be
    // resolved we still return the products — without a price — rather than
    // failing the whole lookup.
    let priceContext: any = null
    try {
      const regions = await graph.graph({
        entity: "region",
        fields: ["id", "currency_code"],
        pagination: { take: 1 },
      })
      const region = regions?.data?.[0]
      if (region) {
        priceContext = {
          variants: {
            calculated_price: QueryContext({
              region_id: region.id,
              currency_code: region.currency_code,
            }),
          },
        }
      }
    } catch {
      // fall through without pricing
    }

    // calculated_price is only requestable alongside a price context — asking for
    // it without one throws and would lose the product list too, not just prices.
    const fields = [
      "id",
      "title",
      "handle",
      "thumbnail",
      "status",
      "variants.id",
      "variants.title",
      ...(priceContext ? ["variants.calculated_price.*"] : []),
    ]

    let products: any[] = []
    try {
      const res = await graph.graph({
        entity: "product",
        fields,
        filters: { q: query, status: "published" },
        pagination: { take },
        ...(priceContext ? { context: priceContext } : {}),
      })
      products = res?.data || []
    } catch (e: any) {
      return `Product search failed: ${e?.message || "unknown error"}`
    }

    if (!products.length) {
      return `No published products matched "${query}".`
    }

    const lines = products.map((p) => {
      // Store money amounts are already in major units (pesos) — do not divide.
      const amounts = (p.variants || [])
        .map((v: any) => v?.calculated_price?.calculated_amount)
        .filter((a: any) => typeof a === "number")
      const price = amounts.length
        ? `₱${Math.min(...amounts).toLocaleString("en-PH")}`
        : "price on the product page"
      return `- ${p.title} — ${price} — /products/${p.handle}`
    })

    return `Products matching "${query}":\n${lines.join("\n")}`
  }

  private async getCustomerOrders(
    customerId: string,
    limit?: number,
    orderNumber?: string
  ): Promise<string> {
    const take = Math.min(Math.max(Number(limit) || 5, 1), 10)
    const graph = this.container.resolve(ContainerRegistrationKeys.QUERY)

    let orders: any[] = []
    try {
      const res = await graph.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "status",
          "created_at",
          "total",
          "currency_code",
          "items.title",
          "items.quantity",
          "fulfillments.id",
          "fulfillments.shipped_at",
          "fulfillments.delivered_at",
          "fulfillments.labels.tracking_number",
          "fulfillments.labels.tracking_url",
          "payment_collections.status",
        ],
        // Scoped by customer_id server-side. The model supplies neither the
        // customer id nor the filter, so it cannot widen this.
        filters: { customer_id: customerId },
        pagination: { take, order: { created_at: "DESC" } },
      })
      orders = res?.data || []
    } catch (e: any) {
      return `Could not read the customer's orders: ${e?.message || "unknown error"}`
    }

    if (orderNumber) {
      const wanted = String(orderNumber).replace(/[^0-9]/g, "")
      if (wanted) {
        const match = orders.filter((o) => String(o.display_id) === wanted)
        if (match.length) orders = match
      }
    }

    if (!orders.length) {
      return "This customer has no orders yet."
    }

    return orders
      .map((o) => {
        const items = (o.items || [])
          .map((i: any) => `${i.quantity}× ${i.title}`)
          .join(", ")
        const tracking = (o.fulfillments || [])
          .flatMap((f: any) => f.labels || [])
          .map((l: any) => l.tracking_number)
          .filter(Boolean)
        const shipped = (o.fulfillments || []).some((f: any) => f.shipped_at)
        const delivered = (o.fulfillments || []).some((f: any) => f.delivered_at)

        const shipping = delivered
          ? "delivered"
          : shipped
            ? "shipped"
            : "not yet shipped"

        // Payment state comes from payment_collection, which is what the order
        // payment badge is derived from — the payment row does not carry status.
        const payment = (o.payment_collections || [])
          .map((pc: any) => pc.status)
          .filter(Boolean)
          .join(", ") || "unknown"

        return [
          `Order #${o.display_id} (placed ${new Date(o.created_at).toISOString().slice(0, 10)})`,
          `  status: ${o.status}, shipping: ${shipping}, payment: ${payment}`,
          `  total: ₱${Number(o.total ?? 0).toLocaleString("en-PH")}`,
          items ? `  items: ${items}` : null,
          tracking.length ? `  tracking: ${tracking.join(", ")}` : null,
          `  order page: /user/orders/${o.id}`,
        ]
          .filter(Boolean)
          .join("\n")
      })
      .join("\n\n")
  }

  // ─── Prompt ─────────────────────────────────────────────────────────────────

  private buildSystemPrompt(opts: { signedIn: boolean; language: string }): string {
    return `You are the Maretinda support assistant, embedded in the Maretinda storefront.
Maretinda is a Philippine online marketplace where independent sellers run their own shops.

ANSWERING
- Answer only from the <context> documents provided in the user turn, or from what a
  tool returns. If neither covers the question, say you do not have that information
  and point the customer to the Help Center (/help-center) or support@maretinda.com.
  Never invent policies, timeframes, prices, fees, or order details.
- Lead with the answer. Two or three short sentences is the target; use a short list
  only when the answer genuinely has several steps.
- Write in ${opts.language}. Match the customer's own wording for product and page names.
- Prices are in Philippine pesos (₱).
- No emoji.

TOOLS
- The context below was retrieved automatically for the customer's latest message.
  If it already answers the question, answer directly without calling any tool.
- Use search_help_center only when the provided context is insufficient.
- Use search_products for availability, catalogue, or "what do you have" questions.
${
  opts.signedIn
    ? "- Use get_my_orders for anything about this customer's own orders. It only ever\n  returns their orders, so it is safe to call whenever they ask about an order."
    : "- The customer is NOT signed in, so their orders cannot be looked up. For order-specific\n  questions, ask them to sign in and open My Account → Orders."
}

BOUNDARIES
- Never state or imply that Maretinda takes a commission on sales. Sellers pay a flat
  monthly subscription; there is no per-sale commission and no listing fee.
- Never ask for or repeat passwords, OTPs, card numbers, or full addresses.
- Do not promise refunds, replacements, cancellations, or delivery dates on a specific
  order. Explain the process and let the seller or the support team make the decision.
- Delivery and returns are handled by each individual seller, so timeframes are the
  published targets rather than guarantees.

Respond with the final answer only — no preamble about what you are about to do.`
  }

  // ─── Generation ─────────────────────────────────────────────────────────────

  /**
   * Answer a question, streaming text deltas through `onText`.
   * Returns a summary used for the query log.
   */
  async streamAnswer(params: {
    question: string
    history: AssistantMessage[]
    customerId: string | null
    language?: string
    onText: (delta: string) => void
    signal?: AbortSignal
  }): Promise<{
    text: string
    toolsUsed: string[]
    retrieved: RetrievedChunk[]
    inputTokens: number
    outputTokens: number
  }> {
    const { question, history, customerId, onText, signal } = params
    const client = this.getClient()

    const retrieved = await this.retrieve(question)
    const toolsUsed: string[] = []
    let inputTokens = 0
    let outputTokens = 0
    let finalText = ""

    const system = this.buildSystemPrompt({
      signedIn: Boolean(customerId),
      language: params.language || "English",
    })

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user" as const,
        content: `<context>\n${this.formatContext(retrieved)}\n</context>\n\nCustomer question: ${question}`,
      },
    ]

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const stream = client.messages.stream(
        {
          model: MODEL,
          max_tokens: 2048,
          // Adaptive lets Claude skip thinking on simple FAQ answers and spend it
          // on multi-step order questions; low effort keeps a support reply snappy.
          thinking: { type: "adaptive" },
          output_config: { effort: "low" },
          system,
          tools: this.buildTools(customerId),
          messages,
        },
        { signal }
      )

      // Only text reaches the customer. Thinking blocks default to omitted on
      // Opus 4.8 and are not forwarded regardless.
      stream.on("text", (delta) => {
        finalText += delta
        onText(delta)
      })

      const message = await stream.finalMessage()
      inputTokens += message.usage?.input_tokens ?? 0
      outputTokens += message.usage?.output_tokens ?? 0

      if (message.stop_reason !== "tool_use") break

      const toolUses = message.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      )

      messages.push({ role: "assistant", content: message.content })

      const results: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        toolsUsed.push(tu.name)
        try {
          const { result, chunks } = await this.runTool(tu.name, tu.input, customerId)
          if (chunks) retrieved.push(...chunks)
          results.push({ type: "tool_result", tool_use_id: tu.id, content: result })
        } catch (e: any) {
          results.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: `Tool failed: ${e?.message || "unknown error"}`,
            is_error: true,
          })
        }
      }

      // All results go back in one user turn — splitting them trains the model
      // out of making parallel tool calls.
      messages.push({ role: "user", content: results })
    }

    return { text: finalText, toolsUsed, retrieved, inputTokens, outputTokens }
  }

  // ─── Telemetry ──────────────────────────────────────────────────────────────

  async logQuery(entry: {
    customerId: string | null
    question: string
    retrieved: RetrievedChunk[]
    toolsUsed: string[]
    inputTokens?: number
    outputTokens?: number
    latencyMs: number
    error?: string
  }): Promise<void> {
    try {
      await this.getDb()("assistant_query_log").insert({
        id: `asstlog_${randomBytes(12).toString("hex")}`,
        customer_id: entry.customerId,
        question: entry.question.slice(0, 2000),
        retrieved_ids: JSON.stringify(entry.retrieved.map((r) => r.source)),
        top_score: entry.retrieved.length ? Number(entry.retrieved[0].distance) : null,
        tools_used: JSON.stringify(entry.toolsUsed),
        input_tokens: entry.inputTokens ?? null,
        output_tokens: entry.outputTokens ?? null,
        latency_ms: entry.latencyMs,
        error: entry.error ?? null,
      })
    } catch {
      // Telemetry must never take down an answer that already reached the customer.
    }
  }
}
