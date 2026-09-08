# Support Assistant (RAG)

The storefront chat widget, backed by retrieval over a pgvector index plus Claude
with three tools. Replaces the old regex intent-matcher in
`maretinda-store/src/components/organisms/Chatbot/Chatbot.tsx`.

## Request path

```
Chatbot widget (browser)
  → POST /api/assistant            (Next.js, attaches the httpOnly _medusa_jwt)
    → POST /store/assistant        (Medusa, SSE)
       ├─ embed question           Voyage
       ├─ pgvector cosine search   assistant_document
       └─ Claude (streaming)       + tools: search_help_center
                                            search_products
                                            get_my_orders (signed-in only)
```

The Next.js route is a pass-through proxy and exists only because the customer's
JWT is httpOnly, so the browser cannot attach it to a cross-origin call itself.

## Environment variables

| Variable | Where | Required | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | backend | yes | Generation. |
| `VOYAGE_API_KEY` | backend | yes | Embeddings — both indexing and query time. |
| `VOYAGE_MODEL` | backend | no | Default `voyage-3.5`. Must emit 1024 dimensions. |
| `ASSISTANT_MODEL` | backend | no | Default `claude-opus-4-8`. |

The store frontend needs no new variables — it reuses `MEDUSA_BACKEND_URL` and
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

## Setup

```bash
# 1. Tables + pgvector extension
npm run db:migrate

# 2. Build the index (idempotent — safe on every deploy)
npm run assistant:index
```

If step 1 fails on `CREATE EXTENSION vector`, the database user lacks the
privilege. Run it once as a superuser (on Cloud SQL, the `cloudsqlsuperuser`
role), then re-run the migration:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Editing the knowledge base

Knowledge lives in `knowledge/*.md`. Each file has frontmatter (`title`, `url`,
`audience`) and is split into one chunk per `##` heading — a heading should be one
self-contained answer.

After editing, re-run `npm run assistant:index`. Only chunks whose content
changed are re-embedded (checksum comparison), and chunks whose heading was
deleted are pruned, so the index cannot drift from the files.

Subscription pricing is **not** in markdown — it is generated at index time from
the `subscription_plan` table so it cannot drift from what billing charges.

## Adding a tool

Tools are declared in `AssistantService.buildTools()` and dispatched in
`runTool()` (`backend/src/services/assistant.ts`). Two rules:

- Anything customer-scoped must re-check `customerId` inside `runTool`, not just
  omit the tool from `buildTools`. `buildTools` controls what the model can see;
  `runTool` is the actual authorisation boundary.
- Never let the model supply the identity a query filters on. `get_my_orders`
  takes no customer id — it is injected server-side.

## Observability

Every turn writes a row to `assistant_query_log`: the question, which chunks were
retrieved, the best cosine distance, which tools ran, token counts, and latency.

To find questions the index answers badly (high distance = nothing relevant
retrieved):

```sql
SELECT question, top_score, tools_used, created_at
  FROM assistant_query_log
 WHERE top_score IS NULL OR top_score > 0.6
 ORDER BY created_at DESC
 LIMIT 50;
```

Those are the questions that need a new `##` section in `knowledge/`.

## Cost and tuning

- `MAX_DISTANCE` (0.75) — the relevance cutoff. Raise it if answers say "I don't
  have that information" too readily; lower it if unrelated context leaks in.
- `output_config.effort` is `low` and thinking is `adaptive`, which keeps a
  support reply fast. Raise effort if answers get shallow on multi-step order
  questions.
- Retrieval runs on every turn (one Voyage call, ~1k tokens). Generation is the
  dominant cost.
- The rate limit in `api/store/assistant/route.ts` is per-instance and in-memory.
  If abuse becomes real, move the counter to Redis — the backend already has one.
