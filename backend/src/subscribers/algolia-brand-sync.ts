import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'

import { applyBrandToAlgolia } from '../lib/algolia-brand'

/**
 * Re-apply brand to Algolia after the Mercur plugin reindexes a product.
 *
 * The plugin handles the same `algolia.products.changed` event and writes the
 * full record (without brand) via addObject. We run after it (short delay) and
 * patch `brand` back on via partialUpdate. This is best-effort; the admin
 * "reindex brands" endpoint guarantees recovery if a write is missed.
 */
export default async function algoliaBrandSyncHandler({
  event,
  container,
}: SubscriberArgs<{ ids?: string[] }>) {
  const ids = event.data?.ids ?? []
  if (!ids.length) return

  // Let the plugin's full-replace land first, then patch brand on top.
  await new Promise((resolve) => setTimeout(resolve, 2500))
  await applyBrandToAlgolia(container, ids).catch(() => undefined)
}

export const config: SubscriberConfig = {
  event: 'algolia.products.changed',
  context: { subscriberId: 'algolia-brand-sync-handler' },
}
