import { urls } from './playwright.config'

/** Wake the cold-started frontends once so the first test doesn't eat the delay. */
export default async function globalSetup() {
  await Promise.all(
    [`${urls.store}/ph`, `${urls.seller}/login`, `${urls.admin}/login`].map((u) =>
      fetch(u, { signal: AbortSignal.timeout(150_000) }).catch(() => undefined)
    )
  )
}
