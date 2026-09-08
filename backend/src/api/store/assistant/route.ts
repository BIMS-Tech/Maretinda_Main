import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getAssistantService, type AssistantMessage } from "../../../services/assistant"

/**
 * POST /store/assistant
 *
 * Streams a RAG-grounded support answer as Server-Sent Events:
 *
 *   data: {"type":"delta","text":"..."}
 *   data: {"type":"sources","sources":[{"title":"...","url":"..."}]}
 *   data: {"type":"done"}
 *   data: {"type":"error","message":"..."}
 *
 * Works signed-out (help content only) and signed-in (adds order lookup).
 */

const MAX_QUESTION_LENGTH = 1000
const MAX_HISTORY = 8

// Per-identity throttle. Cloud Run runs several instances so this is per-instance
// rather than global — it exists to blunt a single abusive client, not to be an
// exact quota. A shared Redis counter would be the upgrade if abuse shows up.
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000
const hits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)

  // Opportunistic cleanup so the map cannot grow without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.length || now - v[v.length - 1] > RATE_WINDOW_MS) hits.delete(k)
    }
  }

  return recent.length > RATE_LIMIT
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id || null
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"

  if (rateLimited(customerId || ip)) {
    return res.status(429).json({ message: "Too many requests — please slow down." })
  }

  const body = (req.body || {}) as {
    question?: string
    history?: AssistantMessage[]
    language?: string
  }

  const question = String(body.question || "").trim()
  if (!question) {
    return res.status(400).json({ message: "question is required" })
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return res
      .status(400)
      .json({ message: `question must be ${MAX_QUESTION_LENGTH} characters or fewer` })
  }

  const history: AssistantMessage[] = Array.isArray(body.history)
    ? body.history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_QUESTION_LENGTH) }))
    : []

  const assistant = getAssistantService(req.scope)
  const startedAt = Date.now()

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  // Cloud Run / nginx buffer SSE by default, which would hold the whole answer
  // until completion and defeat streaming entirely.
  res.setHeader("X-Accel-Buffering", "no")
  res.flushHeaders()

  const send = (payload: object) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    } catch {
      // client disconnected
    }
  }

  // Abort the model call when the customer closes the widget mid-answer, so we
  // stop paying for tokens nobody will read.
  const abort = new AbortController()
  let closed = false
  req.on("close", () => {
    closed = true
    abort.abort()
  })

  try {
    const result = await assistant.streamAnswer({
      question,
      history,
      customerId,
      language: body.language,
      signal: abort.signal,
      onText: (delta) => send({ type: "delta", text: delta }),
    })

    if (!closed) {
      // Deduplicate by url so the widget doesn't render the same link twice when
      // several chunks from one document were retrieved.
      const seen = new Set<string>()
      const sources = result.retrieved
        .filter((c) => c.url && !seen.has(c.url) && seen.add(c.url))
        .slice(0, 3)
        .map((c) => ({ title: c.title, url: c.url }))

      if (sources.length) send({ type: "sources", sources })
      send({ type: "done" })
    }

    await assistant.logQuery({
      customerId,
      question,
      retrieved: result.retrieved,
      toolsUsed: result.toolsUsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: Date.now() - startedAt,
    })
  } catch (e: any) {
    const message = e?.message || "Unknown error"
    if (!closed) {
      send({
        type: "error",
        message:
          "Sorry — I could not answer that right now. Please try again, or email support@maretinda.com.",
      })
    }
    // Log the real cause server-side; the customer only sees the generic line above.
    req.scope.resolve("logger").error(`[assistant] ${message}`)

    await assistant.logQuery({
      customerId,
      question,
      retrieved: [],
      toolsUsed: [],
      latencyMs: Date.now() - startedAt,
      error: message.slice(0, 1000),
    })
  } finally {
    res.end()
  }
}
