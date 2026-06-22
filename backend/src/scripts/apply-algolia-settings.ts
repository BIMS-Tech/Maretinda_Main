#!/usr/bin/env tsx
/**
 * Apply Algolia index settings from algolia-config.json
 *
 * The Mercur Algolia plugin only pushes `searchableAttributes` and re-indexes
 * product *records* (admin → "Trigger Synchronization"). It never applies the
 * full index settings (attributesForFaceting, replicas, ranking, …). Those live
 * in the repo's algolia-config.json and must be pushed to Algolia explicitly —
 * otherwise filters like `collection.title:"…"` silently return zero hits
 * because the attribute isn't in attributesForFaceting.
 *
 * Run once after editing algolia-config.json:
 *   npx tsx src/scripts/apply-algolia-settings.ts
 *
 * Requires ALGOLIA_APP_ID and ALGOLIA_API_KEY (the write/admin key) in env.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

import { algoliasearch } from 'algoliasearch'
import * as dotenv from 'dotenv'

dotenv.config()

const MAIN_INDEX = 'products'
const CONFIG_PATH = resolve(__dirname, '../../../algolia-config.json')

async function main() {
  const appId = process.env.ALGOLIA_APP_ID?.trim()
  const apiKey = process.env.ALGOLIA_API_KEY?.trim()

  if (!appId || !apiKey) {
    throw new Error('Missing ALGOLIA_APP_ID or ALGOLIA_API_KEY in environment')
  }

  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  const client = algoliasearch(appId, apiKey)

  // 1. Main index settings (includes the `replicas` list, so replicas are
  //    created/linked before we configure each one below). Forward to replicas
  //    so they inherit shared settings like attributesForFaceting — otherwise
  //    the `collection.title` filter would work on the default sort but break
  //    on price/rating sorts (which query the replicas).
  console.log(`📦 Applying settings to "${MAIN_INDEX}"…`)
  await client.setSettings({
    indexName: MAIN_INDEX,
    indexSettings: config.settings,
    forwardToReplicas: true,
  })
  console.log('  ✅ main index settings applied (forwarded to replicas)')

  // 2. Per-replica overrides — restore each replica's custom ranking, which the
  //    forwardToReplicas step above just overwrote with the primary's ranking.
  const replicaSettings: Record<string, unknown> = config.replicaSettings ?? {}
  for (const [replica, settings] of Object.entries(replicaSettings)) {
    console.log(`📦 Applying settings to replica "${replica}"…`)
    await client.setSettings({
      indexName: replica,
      indexSettings: settings as Record<string, unknown>,
    })
    console.log(`  ✅ replica "${replica}" settings applied`)
  }

  // 3. Rules & synonyms (no-ops while the arrays are empty, but kept in sync).
  if (Array.isArray(config.rules) && config.rules.length) {
    await client.saveRules({ indexName: MAIN_INDEX, rules: config.rules })
    console.log(`  ✅ ${config.rules.length} rule(s) saved`)
  }
  if (Array.isArray(config.synonyms) && config.synonyms.length) {
    await client.saveSynonyms({
      indexName: MAIN_INDEX,
      synonymHit: config.synonyms,
    })
    console.log(`  ✅ ${config.synonyms.length} synonym(s) saved`)
  }

  console.log('\n🎉 Algolia settings applied. Now re-index records (admin → Algolia → "Trigger Synchronization") so existing products pick up the new facets.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Failed to apply Algolia settings:', err)
    process.exit(1)
  })
