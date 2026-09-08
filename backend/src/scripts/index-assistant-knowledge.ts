import { randomBytes } from "crypto"
import { existsSync } from "fs"
import { join } from "path"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  loadKnowledgeChunks,
  makeDynamicChunk,
  type KnowledgeChunk,
} from "../lib/assistant/chunk"
import { embedDocuments, getVoyageModel, isVoyageConfigured, toVectorLiteral } from "../lib/voyage"

/**
 * Build the assistant's RAG index.
 *
 *   npm run assistant:index
 *
 * Idempotent: chunks are keyed by (source, chunk_index) and skipped when their
 * checksum is unchanged, so a re-run after editing one markdown file embeds only
 * that file's chunks. Safe to run on every deploy.
 */

function resolveKnowledgeDir(): string {
  // In the built image the compiled lib sits in .medusa/server/src/lib/assistant,
  // with the markdown copied alongside it by the postbuild:copy step. Running
  // from source via `medusa exec` resolves to src/lib/assistant/knowledge.
  const candidates = [
    join(__dirname, "..", "lib", "assistant", "knowledge"),
    join(process.cwd(), "src", "lib", "assistant", "knowledge"),
    join(process.cwd(), ".medusa", "server", "src", "lib", "assistant", "knowledge"),
  ]
  const found = candidates.find((c) => existsSync(c))
  if (!found) {
    throw new Error(
      `Knowledge directory not found. Looked in:\n  ${candidates.join("\n  ")}\n` +
        `If this is a built image, make sure the postbuild:copy step copied the .md files.`
    )
  }
  return found
}

/**
 * Subscription pricing changes and must not be duplicated into markdown, where
 * it would silently drift from what the billing code actually charges. Generate
 * that chunk from the plans table at index time instead.
 */
async function buildPlanChunk(db: any): Promise<KnowledgeChunk | null> {
  let plans: any[]
  try {
    plans = await db("subscription_plan").where("status", "active").orderBy("price", "asc")
  } catch {
    return null
  }
  if (!plans?.length) return null

  const lines = plans.map((p: any) => {
    const f = typeof p.features === "string" ? JSON.parse(p.features) : p.features || {}
    const products = f.max_products === -1 ? "unlimited products" : `up to ${f.max_products} products`
    const yearly = p.yearly_price
      ? ` (₱${Number(p.yearly_price).toLocaleString("en-PH")}/year, saving ${p.yearly_discount_percent ?? 0}%)`
      : ""
    const staff = f.staff_accounts ? `, ${f.staff_accounts} staff account(s)` : ""
    const support = f.support ? `, ${f.support} support` : ""
    return `- ${p.name}: ₱${Number(p.price).toLocaleString("en-PH")}/month${yearly} — ${products}${staff}${support}.`
  })

  // "First month free" is the fixed marketing promise, so it is stated
  // verbatim rather than derived from subscription_plan.trial_days (which is a
  // billing implementation detail and does not necessarily equal one month).
  const trial = `\n\nEvery new seller's first month is free. No commission is taken on sales on any plan.`

  return makeDynamicChunk({
    slug: "subscription-plans",
    title: "Seller Subscription Plans",
    section: "Current plans and pricing",
    url: "/#pricing",
    audience: "seller",
    body: `Maretinda sellers pay a flat monthly subscription instead of a per-sale commission. Current plans:\n\n${lines.join("\n")}${trial}`,
  })
}

export default async function indexAssistantKnowledge({ container }: { container: any }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  if (!isVoyageConfigured()) {
    logger.error("VOYAGE_API_KEY is not set — cannot build the assistant index.")
    return
  }

  const chunks = loadKnowledgeChunks(resolveKnowledgeDir())
  const planChunk = await buildPlanChunk(db)
  if (planChunk) chunks.push(planChunk)
  else logger.warn("subscription_plan table unavailable — skipping the live pricing chunk.")

  logger.info(`Assistant index: ${chunks.length} chunks, model ${getVoyageModel()}`)

  const existing: { source: string; checksum: string }[] = await db("assistant_document").select(
    "source",
    "checksum"
  )
  const existingBySource = new Map(existing.map((r) => [r.source, r.checksum]))

  const stale = chunks.filter((c) => existingBySource.get(c.source) !== c.checksum)

  if (!stale.length) {
    logger.info("Assistant index is already up to date — nothing to embed.")
  } else {
    logger.info(`Embedding ${stale.length} new/changed chunk(s)...`)
    const vectors = await embedDocuments(stale.map((c) => c.content))

    for (let i = 0; i < stale.length; i++) {
      const c = stale[i]
      const row = {
        source: c.source,
        chunk_index: c.chunkIndex,
        title: c.title,
        section: c.section,
        url: c.url,
        audience: c.audience,
        content: c.content,
        checksum: c.checksum,
        embedding: toVectorLiteral(vectors[i]),
        updated_at: new Date(),
      }

      await db("assistant_document")
        .insert({ id: `asstdoc_${randomBytes(12).toString("hex")}`, ...row })
        .onConflict(["source", "chunk_index"])
        .merge(row)
    }
    logger.info(`Embedded and stored ${stale.length} chunk(s).`)
  }

  // Prune chunks whose source disappeared — e.g. a section was deleted or a
  // markdown file shrank. Without this, stale answers stay retrievable forever.
  const liveSources = chunks.map((c) => c.source)
  const deleted = await db("assistant_document").whereNotIn("source", liveSources).del()
  if (deleted) logger.info(`Pruned ${deleted} removed chunk(s).`)

  const [{ count }] = await db("assistant_document").count("* as count")
  logger.info(`Assistant index ready: ${count} chunk(s) total.`)
}
