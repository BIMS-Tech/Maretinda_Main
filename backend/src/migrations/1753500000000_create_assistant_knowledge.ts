import { Migration } from "@mikro-orm/migrations"

/**
 * RAG knowledge base for the storefront support assistant.
 *
 * Embeddings live in pgvector inside the existing Medusa database — no separate
 * vector store to operate. The extension ships with Cloud SQL for Postgres but
 * has to be enabled per-database; CREATE EXTENSION needs superuser/cloudsqlsuperuser,
 * so if this migration fails here the DB owner must run it once by hand:
 *
 *   CREATE EXTENSION IF NOT EXISTS vector;
 *
 * Dimension is 1024 to match voyage-3.5 (and voyage-3 / voyage-3-large at their
 * default output_dimension). Changing VOYAGE_MODEL to a model with a different
 * dimension requires a new migration to alter the column and a full re-index.
 */
export class Migration1753500000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS vector;`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "assistant_document" (
        "id"          text        NOT NULL,
        "source"      text        NOT NULL,
        "chunk_index" integer     NOT NULL DEFAULT 0,
        "title"       text        NOT NULL,
        "section"     text        NULL,
        "url"         text        NULL,
        "audience"    text        NOT NULL DEFAULT 'buyer',
        "content"     text        NOT NULL,
        "checksum"    text        NOT NULL,
        "embedding"   vector(1024) NOT NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "assistant_document_pkey" PRIMARY KEY ("id")
      );
    `)

    // One row per (source, chunk_index) so re-indexing is an idempotent upsert.
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "assistant_document_source_chunk_uniq"
        ON "assistant_document" ("source", "chunk_index");
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "assistant_document_audience_idx"
        ON "assistant_document" ("audience");
    `)

    // HNSW beats IVFFlat here: the corpus is small enough that build time is
    // irrelevant, and HNSW needs no training pass or list-count tuning.
    // vector_cosine_ops because the retrieval query orders by <=> (cosine).
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "assistant_document_embedding_idx"
        ON "assistant_document" USING hnsw ("embedding" vector_cosine_ops);
    `)

    // Retrieval telemetry. Deliberately stores the question and which chunks were
    // retrieved (not the customer's PII) so bad answers can be traced back to a
    // retrieval miss vs a generation problem.
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "assistant_query_log" (
        "id"             text        NOT NULL,
        "customer_id"    text        NULL,
        "question"       text        NOT NULL,
        "retrieved_ids"  jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "top_score"      real        NULL,
        "tools_used"     jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "input_tokens"   integer     NULL,
        "output_tokens"  integer     NULL,
        "latency_ms"     integer     NULL,
        "error"          text        NULL,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "assistant_query_log_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "assistant_query_log_created_at_idx"
        ON "assistant_query_log" ("created_at" DESC);
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "assistant_query_log_created_at_idx";`)
    this.addSql(`DROP TABLE IF EXISTS "assistant_query_log";`)
    this.addSql(`DROP INDEX IF EXISTS "assistant_document_embedding_idx";`)
    this.addSql(`DROP INDEX IF EXISTS "assistant_document_audience_idx";`)
    this.addSql(`DROP INDEX IF EXISTS "assistant_document_source_chunk_uniq";`)
    this.addSql(`DROP TABLE IF EXISTS "assistant_document";`)
    // The vector extension is intentionally left installed — other things may use it.
  }
}
