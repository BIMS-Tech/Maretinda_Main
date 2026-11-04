# Testing

| Suite | Where | Run | Needs |
| --- | --- | --- | --- |
| Backend unit | `backend/src/**/__tests__/*.unit.spec.ts` | `cd backend && yarn test:unit` | nothing |
| Backend API integration | `backend/integration-tests/http/*.spec.ts` | `cd backend && DB_USERNAME=postgres DB_PASSWORD=… DB_HOST=localhost yarn test:integration:http` | local Postgres (pgvector optional) |
| Storefront unit | `maretinda-store/src/**/__tests__/*.test.ts` | `cd maretinda-store && npm test` | dev dependencies (`npm install --include=dev` if your npm omits them) |
| Seller / admin unit | `maretinda-{seller,admin}/src/**/__tests__` | `npm test` in that folder | |
| Browser E2E | `e2e/tests` | `cd e2e && npm test` | see below |
| Manual QA | [docs/qa-test-cases.md](docs/qa-test-cases.md) | by hand on the test environment | |

## Backend integration tests

Each suite boots the whole Medusa app against a throwaway database that the test runner creates and drops, applies `src/migrations` the way `run-custom-migrations.ts` does in production, and truncates every table between tests.

`backend/.env.test` is loaded before `.env` and blanks every external integration (Redis, Algolia, Resend, Stripe, storage, Anthropic, Voyage, Meshy, Flying Tigers), so a test run can't send email or book a courier, whatever is in your local `.env`. It also runs the app in `MEDUSA_WORKER_MODE=server`, so no scheduled jobs or subscribers fire.

The `security-*.spec.ts` suites attack the app the way a hostile user would: unpaid checkout, forged and replayed payments, access to other sellers' and customers' data, forged tokens, spoofed courier webhooks, disguised uploads, and malformed input. `security-access` walks every custom `/admin` and `/vendor` route file, so a new route without auth fails the suite automatically.

Users are created through their module services and given JWTs signed with the test secret, because Mercur's seller signup goes through admin approval handled by subscribers.

## E2E

The suite runs against the test environment by default. Override it with `STORE_URL`, `SELLER_URL` and `ADMIN_URL`.

- `npm test` runs only read-only checks.
- Signed-in seller and admin checks run when you set `E2E_SELLER_EMAIL`/`E2E_SELLER_PASSWORD` and `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`.
- `E2E_ALLOW_WRITES=1 E2E_EMAIL=you@yourdomain` registers a buyer and fills a cart. Adding `E2E_PLACE_ORDER=1` also places a COD order, which emails the seller. Never use this against production.

## Known failures

Tests marked `it.failing` / `test.fail` describe the correct behaviour of a known bug. They pass while the bug exists and start failing once it's fixed: at that point, remove the marker. Only one is left: the deployed test admin doesn't redirect logged-out visitors to login (`e2e/tests/admin/admin.spec.ts`).

## Still open

These can't be closed by a code change here:

1. **Rotate the leaked GCP key.** `backend/config/gcs-key.json` was committed. It's now untracked, but it remains in git history.
2. **Restrict the servers to Cloudflare.** The origin answers direct requests, so `CF-Connecting-IP` can be forged there to dodge rate limits.
3. **Seller identity documents are public.** `/store/uploads` stores valid IDs and BIR papers at public URLs. They should move to private storage with signed links.
4. **Set `NINJAVAN_WEBHOOK_SECRET`** (or store the client secret on the provider), or Ninja Van status updates are rejected.
