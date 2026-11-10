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

Credentials live in `e2e/.env` (gitignored). Copy [e2e/.env.example](e2e/.env.example), fill it, and load it before running: `set -a && . ./.env && set +a && npx playwright test`. Use Resend's test inbox (`E2E_EMAIL=delivered@resend.dev`) so signups never email a real person.

- `npm test` runs only read-only checks.
- Signed-in seller and admin checks run when you set `E2E_SELLER_EMAIL`/`E2E_SELLER_PASSWORD` and `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`.
- `E2E_ALLOW_WRITES=1` registers buyers, sellers and products and fills carts. Adding `E2E_PLACE_ORDER=1` also places COD orders, which email the seller. Never use either against production.
- `E2E_GIYAPAY_SANDBOX_CONFIRMED=1` runs the GiyaPay payment and subscription cases. Check Admin → GiyaPay shows sandbox mode first.
- `E2E_STORE_SECRET_CONFIGURED=1` runs the login throttling case (SEC-05), once `STORE_SERVER_SECRET` is set on both the store and the backend.

The full run takes about 15 minutes:

```bash
cd e2e && set -a && . ./.env && set +a
E2E_PLACE_ORDER=1 E2E_GIYAPAY_SANDBOX_CONFIRMED=1 npx playwright test
```

Each spec is named after the QA case IDs it covers (`ACC-`, `BRW-`, `CHK-`, `SEL-`, `SOP-`, `SUB-`, `ADM-`, `SEC-`). Results for the 2026-11-09 run are in [docs/qa-results/2026-11-09.md](docs/qa-results/2026-11-09.md).

Things the specs know about the test environment:

- Admin and seller sign-ins are rate limited per account, so sessions are cached in the system temp folder (`maretinda-e2e-*.json`) for six hours.
- The seller onboarding spec (`tests/seller/onboarding.writes.spec.ts`) needs `SELLER_URL=http://localhost:5173` (a local seller panel on `test-api`) until the testseller Vercel project has `VITE_PUBLISHABLE_API_KEY`.
- Seller applications are limited to 5 an hour per address. Restarting the test backend clears the in-memory limits.

## Known failures

Tests marked `it.failing` / `test.fail` describe the correct behaviour of a known bug. They pass while the bug exists and start failing once it's fixed: at that point, remove the marker.

- **BRW-08 price sorting** (`e2e/tests/store/browse.spec.ts`): the Algolia sort indexes were never created, so every sort is a no-op. Run `backend/src/scripts/apply-algolia-settings.ts` against the live search app, then remove the marker.

## Still open

These can't be closed by a code change here:

1. **Rotate the leaked GCP key.** `backend/config/gcs-key.json` was committed. It's now untracked, but it remains in git history.
2. **Restrict the servers to Cloudflare.** The origin answers direct requests, so `CF-Connecting-IP` can be forged there to dodge rate limits.
3. **Seller identity documents are public.** `/store/uploads` stores valid IDs and BIR papers at public URLs. They should move to private storage with signed links.
4. **Set `NINJAVAN_WEBHOOK_SECRET`** (or store the client secret on the provider), or Ninja Van status updates are rejected.
5. **Set `STORE_SERVER_SECRET`** (16+ characters, the same value) in the backend's and the storefront's environment. Until then the backend can't tell buyers apart when the store signs them in, and production would allow only 10 new accounts an hour.
6. **Settlement files are public too.** TAMA/DFT files with seller bank account numbers go to the same public media bucket as item 3.
7. **testseller (Vercel) needs `VITE_PUBLISHABLE_API_KEY`**, or seller sign-up and document uploads fail on test.
