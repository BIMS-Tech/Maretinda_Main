import { createHash } from "crypto"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

export type KnowledgeChunk = {
  /** Stable identity: "<file-slug>#<chunk-index>" — the upsert key. */
  source: string
  chunkIndex: number
  title: string
  section: string | null
  url: string | null
  audience: "buyer" | "seller"
  content: string
  checksum: string
}

type Frontmatter = {
  title: string
  url: string | null
  audience: "buyer" | "seller"
}

/**
 * Minimal YAML frontmatter reader — only flat `key: value` pairs, which is all
 * the knowledge files use. Pulling in a YAML dependency for three keys isn't
 * worth it.
 */
function parseFrontmatter(raw: string, fallbackTitle: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { meta: { title: fallbackTitle, url: null, audience: "buyer" }, body: raw }
  }

  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) meta[kv[1]] = kv[2].trim()
  }

  return {
    meta: {
      title: meta.title || fallbackTitle,
      url: meta.url || null,
      audience: meta.audience === "seller" ? "seller" : "buyer",
    },
    body: match[2],
  }
}

/**
 * Split on `##` headings rather than a fixed token window. The knowledge files
 * are hand-authored so each section is already one self-contained answer —
 * splitting mid-section is what produces the "retrieved the right doc but the
 * wrong half of it" failure mode.
 */
function splitSections(body: string): { section: string | null; content: string }[] {
  const lines = body.split(/\r?\n/)
  const out: { section: string | null; content: string }[] = []

  let section: string | null = null
  let buffer: string[] = []

  const flush = () => {
    const content = buffer.join("\n").trim()
    if (content) out.push({ section, content })
    buffer = []
  }

  for (const line of lines) {
    const heading = line.match(/^##\s+(.*)$/)
    if (heading) {
      flush()
      section = heading[1].trim()
    } else {
      buffer.push(line)
    }
  }
  flush()

  return out
}

export function chunkMarkdown(slug: string, raw: string): KnowledgeChunk[] {
  const { meta, body } = parseFrontmatter(raw, slug)

  return splitSections(body).map((s, i) => {
    // The document and section titles are prepended to the embedded text so a
    // chunk carries its own context. Without this, a section like "Refund
    // timelines" embeds with no signal that it is about Maretinda returns, and
    // it competes badly against every other doc that mentions days and banks.
    const heading = s.section ? `${meta.title} — ${s.section}` : meta.title
    const content = `${heading}\n\n${s.content}`

    return {
      source: `${slug}#${i}`,
      chunkIndex: i,
      title: meta.title,
      section: s.section,
      url: meta.url,
      audience: meta.audience,
      content,
      checksum: createHash("sha256").update(content).digest("hex"),
    }
  })
}

/** Read and chunk every .md file in the knowledge directory. */
export function loadKnowledgeChunks(dir = join(__dirname, "knowledge")): KnowledgeChunk[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort()

  return files.flatMap((file) => {
    const slug = file.replace(/\.md$/, "")
    return chunkMarkdown(slug, readFileSync(join(dir, file), "utf8"))
  })
}

/**
 * Build a chunk from text generated at index time (e.g. live subscription plan
 * pricing pulled from the database) so that volatile facts don't have to be
 * duplicated into markdown and drift.
 */
export function makeDynamicChunk(params: {
  slug: string
  title: string
  section: string
  url: string | null
  audience: "buyer" | "seller"
  body: string
}): KnowledgeChunk {
  const content = `${params.title} — ${params.section}\n\n${params.body.trim()}`
  return {
    source: `${params.slug}#0`,
    chunkIndex: 0,
    title: params.title,
    section: params.section,
    url: params.url,
    audience: params.audience,
    content,
    checksum: createHash("sha256").update(content).digest("hex"),
  }
}
