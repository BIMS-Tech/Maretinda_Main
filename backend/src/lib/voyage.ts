/**
 * Voyage AI embeddings client.
 *
 * Anthropic does not ship an embeddings endpoint, so the retrieval half of the
 * assistant uses Voyage (Anthropic's recommended embedding provider). There is
 * no official Node SDK — this is a thin fetch wrapper over the REST API.
 *
 * Env:
 *   VOYAGE_API_KEY  (required)
 *   VOYAGE_MODEL    (default "voyage-3.5")
 *
 * The output dimension is pinned to 1024 to match the vector(1024) column in
 * migration 1753500000000. Pointing VOYAGE_MODEL at a model that cannot emit
 * 1024 dimensions (e.g. voyage-3-lite, which is 512) will fail at request time
 * rather than silently writing unusable vectors.
 */

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"

export const EMBEDDING_DIMENSIONS = 1024

/** Voyage embeds queries and documents asymmetrically; passing the wrong one measurably hurts recall. */
export type VoyageInputType = "query" | "document"

export function getVoyageModel(): string {
  return process.env.VOYAGE_MODEL || "voyage-3.5"
}

export function isVoyageConfigured(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY)
}

type VoyageResponse = {
  data?: { embedding: number[]; index: number }[]
  usage?: { total_tokens: number }
  detail?: string
}

async function embed(
  inputs: string[],
  inputType: VoyageInputType,
  signal?: AbortSignal
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set — the assistant cannot embed text")
  }
  if (!inputs.length) return []

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getVoyageModel(),
      input: inputs,
      input_type: inputType,
      output_dimension: EMBEDDING_DIMENSIONS,
      truncation: true,
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Voyage embeddings failed (${res.status}): ${body.slice(0, 500)}`)
  }

  const json = (await res.json()) as VoyageResponse
  if (!json.data?.length) {
    throw new Error(`Voyage returned no embeddings: ${json.detail || "unknown error"}`)
  }

  // The API is documented to preserve order, but it also returns an explicit
  // index — sort by it so a future change can't silently misalign vectors with
  // their source chunks (a bug that would be invisible until answers went wrong).
  const sorted = [...json.data].sort((a, b) => a.index - b.index)
  const vectors = sorted.map((d) => d.embedding)

  for (const v of vectors) {
    if (v.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Voyage model "${getVoyageModel()}" returned ${v.length} dimensions, ` +
          `but the assistant_document.embedding column is vector(${EMBEDDING_DIMENSIONS}). ` +
          `Use a 1024-dimension model or migrate the column.`
      )
    }
  }

  return vectors
}

/** Embed a single search query. */
export async function embedQuery(text: string, signal?: AbortSignal): Promise<number[]> {
  const [vector] = await embed([text], "query", signal)
  return vector
}

/**
 * Embed a batch of documents for indexing.
 * Voyage caps a single request at 1000 inputs; batching here keeps the
 * ingestion script from having to know that limit.
 */
export async function embedDocuments(texts: string[], batchSize = 96): Promise<number[][]> {
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    out.push(...(await embed(batch, "document")))
  }
  return out
}

/** pgvector accepts its literal as '[1,2,3]' — not a Postgres array. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`
}
