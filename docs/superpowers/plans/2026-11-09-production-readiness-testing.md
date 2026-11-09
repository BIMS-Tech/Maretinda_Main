# Production Readiness Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every journey on the storefront, seller panel and admin panel has been run on the test environment, every P1 failure is fixed with a test that would have caught it, and the owner has a report of what passed, what was fixed and what's left.

**Architecture:**
- Turn [docs/qa-test-cases.md](../../qa-test-cases.md) into Playwright specs under `e2e/tests/` that run against the Vercel test frontends and `test-api.maretinda.com`.
- Add API-level ownership attacks to the backend integration suites.
- Record each case's outcome in a results ledger.
- Fix bugs test-first and push them to `main`, which redeploys test.
- Publish the ledger as the owner's report.

**Tech Stack:** Playwright 1.55 (`e2e/`); Medusa integration tests (`@medusajs/test-utils`, Jest); Vitest for store, seller and admin unit tests; Medusa 2.11.2 + Mercur 1.5.3.

**Spec:** [docs/superpowers/specs/2026-11-09-production-readiness-testing-design.md](../specs/2026-11-09-production-readiness-testing-design.md)

## Global Constraints

- **Target:** the test environment only (teststore, testseller and testadmin `.maretinda.com`, and `https://test-api.maretinda.com`).
  - Production allows read-only queries only.
  - Releasing to `production` needs the owner's yes, once, at the end.
- **Couriers:** never submit a valid Flying Tigers booking. Before any shipping case, confirm Admin → Shipping providers shows the couriers disabled. If one is enabled, stop and ask.
- **GiyaPay:** pay only while `giyapay_config.sandbox_mode = true` on test. Re-check before each payment case.
- **Email:**
  - Signups use `E2E_EMAIL=delivered@resend.dev`, so `uniqueEmail()` yields `delivered+e2e-<tag>-<ts>@resend.dev`. Never use a real person's address.
  - Check email content only through Resend's read-only list endpoint.
- **Shared media bucket:** test shares production's `maretinda-media`. Never call `DELETE /admin/uploads/*` or `DELETE /vendor/uploads/*` on test.
- **Accounts and secrets:**
  - Use test-only accounts. Never use the owner's admin login.
  - Credentials live in `e2e/.env`, which is gitignored by the root `.gitignore`. Never commit them.
- **Money:** Medusa amounts are pesos. Expected strings look like `₱1,540.00`.
- **No behaviour changes without asking:** pricing, voucher rules, trial length or plan features. Batch such questions into one message.
- **Out of this round:** Google sign-in (ACC-05) is "Not run (owner's decision)". The mobile app, marketing website and load testing are excluded.
- **Commits:** end every message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Cold starts:** Vercel test frontends can take up to 90s to wake. A spec that fails only on the first navigation is a timing issue, not a product bug. Keep `globalSetup` warming and the 120s navigation timeout, and never mark a case Fail on a first-load timeout alone.
2. **Mobile width:** BRW-13 already found one mobile bug, and buyers mostly browse at phone width. Add a `mobile` Playwright project (`devices['Pixel 7']`) that runs `store/browse.spec.ts` and `store/checkout.writes.spec.ts` (Task 3, Step 1).
3. **Multi-seller carts:** carts with two sellers split into two orders. Totals, vouchers and emails must each stay with the right seller. Pin this in CHK-09 (Task 4) with assertions on both sellers' order totals.
4. **Wrong money units:** amounts 100× too small or too large have caused four bugs (shipping, hero card, voucher minimum, email). Every spec that reads a price asserts the exact formatted peso string, never just `/₱/`.
5. **Refreshing a payment return page:** a buyer refreshing a GiyaPay or subscription return page must not create a second order or subscription. Pin it in SEC-02 (Task 8) and SUB-04 (Task 6).

---

### Task 1: Test accounts, environment file and results ledger

**Files:**
- Create: `e2e/.env.example`
- Create: `docs/qa-results/2026-11-09.md`
- Modify: `TESTING.md` (E2E section: how to fill `e2e/.env`)

**Interfaces:**
- Produces:
  - Env vars: `E2E_EMAIL`, `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`, `E2E_SELLER_EMAIL`/`E2E_SELLER_PASSWORD` (seller A, approved, has products with weight), `E2E_SELLER_B_EMAIL`/`E2E_SELLER_B_PASSWORD` (seller B, approved), `E2E_ALLOW_WRITES=1`.
  - The ledger table format, used by every later task: `| ID | Result | Commit | Notes |`, where Result is one of `Pass`, `Fail`, `Fixed (<sha>)`, `Blocked (<reason>)` or `Not run (<reason>)`.

- [ ] **Step 1: Check the safety switches on test**

Run (read-only):
```bash
ssh deploy@213.35.117.254 'docker exec maretinda-postgres-1 sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -Atc \"select sandbox_mode from giyapay_config; select to_jsonb(p) - '\''credentials'\'' from platform_shipping_provider p where deleted_at is null\""'
```
Expected: `t`, and every courier row shows it switched off. The table has no `is_enabled` column, so read the row's fields. If any courier is on, stop and ask the owner.

- [ ] **Step 2: Create the test admin on test**

Run `ssh deploy@213.35.117.254 'docker exec maretinda-backend-1 npx medusa user -e qa-admin@maretinda.com -p <generated>'`.
Expected: "User created". Store the email and password in `e2e/.env`.

- [ ] **Step 3: Create sellers A and B**

Use the seller panel register flow with `delivered+e2e-seller-a@resend.dev` and `delivered+e2e-seller-b@resend.dev`, then approve both in testadmin with the Task 1 admin. Give seller A two products (one ₱770, one ₱444), each with weight 0.5 kg and stock 50.
Expected: both sign in to testseller and reach the dashboard. This is also the first pass of SEL-01, SEL-02, SEL-03 and SOP-01; record those in the ledger.

- [ ] **Step 4: Write `e2e/.env.example`**

List every variable from "Produces" with an empty value, plus a one-line comment per variable. Also fill a real `e2e/.env` and confirm `git status` doesn't list it.

- [ ] **Step 5: Create the ledger**

Create `docs/qa-results/2026-11-09.md`:
- one section per QA section, 1–8 and a new "9. Gaps";
- every existing case ID pre-listed with Result `Not run`;
- ACC-05 set to `Not run (owner's decision)`.

- [ ] **Step 6: Commit**

```bash
git add e2e/.env.example docs/qa-results/2026-11-09.md TESTING.md
git commit -m "test: add QA results ledger and E2E env template"
```

---

### Task 2: Baseline every automated suite

**Files:**
- Modify: `docs/qa-results/2026-11-09.md` (new "Automated suites" section)

- [ ] **Step 1: Backend unit tests**

Run: `cd backend && TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules npx jest --silent --runInBand --forceExit`
Expected: `Tests: 236 passed`.

- [ ] **Step 2: Backend integration tests**

Run: `cd backend && DB_USERNAME=postgres DB_PASSWORD=<from backend/.env DATABASE_URL> DB_HOST=localhost yarn test:integration:http`
Expected: every suite passes. Record each failure with its first error line.

- [ ] **Step 3: Store, seller and admin unit tests**

Run `npx vitest run` in `maretinda-store`, then `npm test` in `maretinda-seller` and in `maretinda-admin`.
Expected: all pass (the store has 109 tests).

- [ ] **Step 4: Existing E2E, read-only and writes**

Run: `cd e2e && set -a && . ./.env && set +a && npx playwright test`
Expected: all pass. Run it a second time with `E2E_PLACE_ORDER=1`.

- [ ] **Step 5: Record and commit**

Record pass and fail counts per suite in the ledger. Every failure becomes a bug entry for Task 9.
```bash
git add docs/qa-results/2026-11-09.md && git commit -m "test: record automated suite baseline"
```

---

### Task 3: Storefront account and browsing specs (ACC, BRW)

**Files:**
- Create: `e2e/tests/store/account.writes.spec.ts` (ACC-01–04, ACC-06–08)
- Create: `e2e/tests/store/browse.spec.ts` (BRW-01–13; move the overlapping checks out of `smoke.spec.ts` and leave `smoke.spec.ts` as the 30-second health check)
- Modify: `e2e/playwright.config.ts` (add a `mobile` project)

**Interfaces:**
- Consumes: `test`, `expect`, `uniqueEmail`, `writesAllowed`, `expectNoErrorBoundary` from `e2e/tests/fixtures.ts`; the env from Task 1.
- Produces: `signInBuyer(page, email, password): Promise<void>` and `registerBuyer(page, tag): Promise<{ email: string; password: string }>`, both exported from `e2e/tests/fixtures.ts` and used by Tasks 4, 6 and 8.

- [ ] **Step 1: Add the mobile project**

In `playwright.config.ts`, add `{ name: 'mobile', use: { ...devices['Pixel 7'], baseURL: urls.store }, testMatch: /store\/(browse|checkout\.writes)\.spec\.ts/ }`.

- [ ] **Step 2: Write the specs**

Write one `test()` per case ID, titled `'<ID> <case name>'` (for example, `'BRW-13 search on a phone'`). Assertions are each case's "Expected" column in `docs/qa-test-cases.md`, with exact values. For example:
- ACC-03 asserts the URL stays on `/login` and an error is visible.
- BRW-02 asserts the URL matches `/categories?query=shirt`.
- BRW-04 asserts `pageErrors` is empty after opening each tab.

- [ ] **Step 3: ACC-04 (forgot password)**

Assert the reset request returns the success screen. Then confirm the reset email exists via `GET https://api.resend.com/emails?limit=20` (read-only, using the test `RESEND_API_KEY` from the test server's `backend.env`). The new-password step is `Not run (email link not reachable from a Resend test inbox)` unless the email's link can be read from that API.

- [ ] **Step 4: Run the specs**

Run: `npx playwright test tests/store/account.writes.spec.ts tests/store/browse.spec.ts`
Expected: each case passes or fails for a product reason. Fix any spec bugs before going on.

- [ ] **Step 5: Ledger, then commit**

Record each case in the ledger. Each product failure becomes a Task 9 bug.
```bash
git add e2e && git add docs/qa-results/2026-11-09.md && git commit -m "test(e2e): storefront account and browsing cases"
```

---

### Task 4: Cart, voucher and checkout specs (CHK)

**Files:**
- Modify: `e2e/tests/store/checkout.writes.spec.ts` (CHK-01–09, CHK-14, CHK-15)
- Create: `e2e/tests/store/vouchers.writes.spec.ts` (CHK-10–13, plus the 2026-11-09 voucher journeys)

**Interfaces:**
- Consumes: `registerBuyer` and `signInBuyer` (Task 3); the Task 1 sellers and products.
- Produces: `placeCodOrder(page): Promise<string>`, returning the order id, exported from `fixtures.ts` and used by Tasks 5 and 8.

- [ ] **Step 1: Write the checkout cases**

Use these exact amounts:
- CHK-01: one ₱770 item shows `₱770.00`, and quantity 2 shows `₱1,540.00`.
- CHK-03: the shipping fee row is greater than ₱0. For 0.5 kg on Standard, record the value and flag it if it is outside ₱50–₱200.
- CHK-05: the confirmation page shows `Cash on Delivery`, and `Online Payment` has count 0.
- CHK-09: a cart with seller A's ₱770 item and seller B's item gives two orders, with each order total equal to its own items plus its own shipping.

- [ ] **Step 2: Write the GiyaPay cases (CHK-07, CHK-08)**

Re-check `sandbox_mode = t` (Task 1, Step 1) inside the test with a `test.skip` guard that reads `E2E_GIYAPAY_SANDBOX_CONFIRMED=1`. Pay or cancel on GiyaPay's sandbox page. If the sandbox page needs credentials the plan doesn't have, record `Blocked (GiyaPay sandbox credentials)` and move on.

- [ ] **Step 3: Write the voucher cases**

These match the 2026-11-09 behaviour:
- `NOPE123` → `NOPE123 isn't a valid voucher code for this cart`.
- Guest + HELLOMRTD → `Sign in to use this first-order voucher`.
- ₱770 cart + `hellomrtd` → `Spend ₱730 more to use hellomrtd (min. spend ₱1,500)`.
- ₱1,540 cart → `HELLOMRTD applied`, with Subtotal `₱1,540.00`, `−₱200.00` and Total `₱1,340.00` plus shipping.
- After a completed order, the same buyer gets `This voucher is only for first-time buyers`.

CHK-12 refers to an old "₱100 first-order voucher". Update the QA doc case to HELLOMRTD (₱200, min. ₱1,500).

- [ ] **Step 4: Run the specs**

Run: `npx playwright test tests/store/checkout.writes.spec.ts tests/store/vouchers.writes.spec.ts` with `E2E_PLACE_ORDER=1`.
Expected: every case passes or fails for a product reason.

- [ ] **Step 5: Ledger, then commit**

```bash
git add e2e docs/qa-test-cases.md docs/qa-results/2026-11-09.md && git commit -m "test(e2e): cart, voucher and checkout cases"
```

---

### Task 5: Seller onboarding, catalog and order specs (SEL, SOP)

**Files:**
- Create: `e2e/tests/seller/onboarding.writes.spec.ts` (SEL-01–06)
- Create: `e2e/tests/seller/catalog-orders.writes.spec.ts` (SOP-01–10)
- Modify: `e2e/tests/fixtures.ts`

**Interfaces:**
- Consumes: `placeCodOrder` (Task 4); sellers A and B (Task 1).
- Produces: `signInSeller(page, email, password)` and `signInAdmin(page, email, password)` in `fixtures.ts`, used by Tasks 6, 7 and 8.

- [ ] **Step 1: Write the onboarding cases**

SEL-04 uploads small genuine PNGs and PDFs generated in the test from fixed bytes. Uploads now go to the shared bucket; delete nothing afterwards.

- [ ] **Step 2: Write the catalog and order cases**

- SOP-03 asserts `Captured` in both the seller and admin panels.
- SOP-04 signs in as seller B and calls `POST /vendor/orders/<A's order>/capture` through `page.request`, asserting 404.
- SOP-05 stops before any courier booking is submitted. If the only shipping path is a courier, record the status steps that can't run as `Blocked (courier booking)`.
- SOP-06 asserts the landline validation message and never submits a valid booking.

- [ ] **Step 3: Run the specs**

Run: `npx playwright test tests/seller`
Expected: every case passes or fails for a product reason.

- [ ] **Step 4: Ledger, then commit**

```bash
git add e2e docs/qa-results/2026-11-09.md && git commit -m "test(e2e): seller onboarding, catalog and order cases"
```

---

### Task 6: Subscription and admin specs (SUB, ADM)

Project 2 (the subscriptions cross-check) goes deeper. This task only runs the existing cases, so project 2 starts from known results.

**Files:**
- Create: `e2e/tests/seller/subscription.writes.spec.ts` (SUB-01–08)
- Modify: `e2e/tests/admin/admin.spec.ts` (ADM-01–05)

**Interfaces:**
- Consumes: `signInSeller` and `signInAdmin` (Task 5); a fresh seller C, registered and approved inside the spec for SUB-02 and SUB-03, so seller A's plan state isn't spent.

- [ ] **Step 1: Write the subscription cases**

- SUB-01 asserts the exact prices `₱499`, `₱1,499` and `₱3,999`.
- The trial length is checked against `subscription_plan.trial_days`, read on test. Record any page whose trial length differs from it as a finding, not a fix: the trial length is the owner's decision.
- SUB-04 (sandbox only, same guard as Task 4 Step 2) reloads the return URL and asserts Admin → Subscriptions still shows exactly one active subscription for seller C.

- [ ] **Step 2: Write the admin cases**

- ADM-03: if editing the hero would change test's storefront only, do it and then restore the original copy.
- ADM-05: if the report needs a period with orders, use today's orders from Tasks 4 and 5.

- [ ] **Step 3: Run the specs**

Run: `npx playwright test tests/seller/subscription.writes.spec.ts tests/admin`
Expected: every case passes or fails for a product reason.

- [ ] **Step 4: Ledger, then commit**

```bash
git add e2e docs/qa-results/2026-11-09.md && git commit -m "test(e2e): subscription and admin cases"
```

---

### Task 7: Gap cases the QA list doesn't cover

**Files:**
- Modify: `docs/qa-test-cases.md`:
  - BRW-14 (home top-sellers carousel dots)
  - CHK-16 (voucher messages, pointing at Task 4's spec)
  - SOP-11 (seller return handling)
  - SOP-12 (payouts / settlement view)
  - SOP-13 (3D model tab per plan)
  - ADM-06 (reels moderation)
  - ADM-07 (seller payouts)
  - ACC-09 (account deletion, only if the feature exists; otherwise record that it doesn't)
  - BRW-15 (help center chat answers in English without emoji)
- Create: `e2e/tests/store/gaps.spec.ts`, `e2e/tests/seller/gaps.writes.spec.ts`, `e2e/tests/admin/gaps.spec.ts`

- [ ] **Step 1: Add the cases to the QA doc**

Write each case in the doc's table format with a priority. BRW-14 is P2. The expected result is that the dots match the number of slides and clicking one moves the row. If there are fewer sellers than fit on one row, the dots are hidden.

- [ ] **Step 2: Automate them**

Automate each case in the matching gaps spec, following the Task 3, Step 2 conventions.

- [ ] **Step 3: Run the specs**

Run: `npx playwright test -g "BRW-14|BRW-15|SOP-1[1-3]|ADM-0[67]|ACC-09|CHK-16"`
Expected: every case passes or fails for a product reason.

- [ ] **Step 4: Ledger, then commit**

```bash
git add e2e docs && git commit -m "test: cover journeys missing from the QA list"
```

---

### Task 8: Attacks: ownership at the API, abuse in the browser

**Files:**
- Modify: `backend/integration-tests/http/security-access.spec.ts`, inside `describe("a seller can't touch another seller's things")`
- Create: `e2e/tests/store/abuse.writes.spec.ts` (SEC-01–07)

**Interfaces:**
- Consumes: `createSeller`, `createCustomer`, `bearer`, `noThrow` and `pgOf` from `backend/integration-tests/helpers.ts`; `placeCodOrder` and `signInSeller` (Tasks 4–5).

- [ ] **Step 1: Write failing-if-leaky ownership tests**

In each case, seller B targets something seller A owns. Expected: 403 or 404, and the row unchanged in `pgOf` afterwards.
- `it("read, set primary or delete another seller's 3D model")`: `/vendor/3d-models/:modelId`, `/:modelId/set-primary`, `/products/:productId`, `/tasks/:taskId`.
- `it("read or edit another seller's campaign")`: `/vendor/campaigns/:id`, `/vendor/campaigns/:id/promotions/batch`, `/vendor/campaign-view/:id`.
- `it("read or post into another seller's chat")`: `/vendor/chat/:id`, `/message`, `/read`.
- `it("change another seller's flash sale or its items")`: `/vendor/flash-sales/:id`, `/:id/items`, `/:id/items/:item_id`.
- `it("reply to another seller's review")`: `/vendor/sellers/me/review/:id` and `/vendor/sellers/me/reviews/:id`.
- `it("edit another seller's promotion rules")`: `/vendor/promotions/:id/:ruleType` and `/batch`, unless the existing `use another seller's promotion` test already calls them. Check before adding.

- [ ] **Step 2: Run them**

Run: `cd backend && yarn test:integration:http -t "another seller"`
Expected: a test that passes means the route is safe. A test that fails is a real leak: record it in the ledger as a P1 and fix it in Task 9.

- [ ] **Step 3: Write the browser abuse cases**

Automate SEC-01 to SEC-07 per the QA doc, with exact expectations:
- SEC-04: the final URL host is `teststore.maretinda.com`.
- SEC-05: the 11th failed login shows a rate-limit message, and a different account still signs in.

- [ ] **Step 4: Run them**

Run: `npx playwright test tests/store/abuse.writes.spec.ts`
Expected: every case passes or fails for a product reason.

- [ ] **Step 5: Ledger, then commit**

```bash
git add backend/integration-tests e2e docs/qa-results && git commit -m "test(security): seller ownership attacks and browser abuse cases"
```

---

### Task 9: Fix loop (repeat per bug, highest priority first)

Each bug recorded by Tasks 2–8 goes through this cycle. Bugs that need a behaviour change go into one batched question to the owner instead, and their cases are marked `Blocked (owner decision: <question>)` until answered.

**Files:** whatever the bug touches; the test lives next to the code it covers:
- backend: `src/**/__tests__/*.unit.spec.ts` or `integration-tests/http/*.spec.ts`;
- store, seller, admin: `src/**/__tests__/*.test.ts` or `*.spec.ts`.

- [ ] **Step 1: Write the smallest failing test**

Write the smallest test that reproduces the bug at the lowest layer that shows it: unit before integration, integration before E2E.

- [ ] **Step 2: Confirm the failure**

Run it and confirm it fails for the bug's reason.

- [ ] **Step 3: Fix it**

Fix the bug. Follow the surrounding code's style; no unrelated refactors.

- [ ] **Step 4: Run the affected suites**

Run the new test, then the full suite for that app (the commands from Task 2).
Expected: all green.

- [ ] **Step 5: Commit, push, wait for test**

Commit as `fix(<app>): <buyer- or seller-visible effect>`, then push to `main`. Wait for "Deploy backend to test (Oracle)" and the Vercel status to report success. Use `gh run watch` and `gh api repos/BIMS-Tech/Maretinda_Main/commits/<sha>/statuses`.

- [ ] **Step 6: Re-run on test**

Re-run the case's E2E spec against test, and mark the ledger `Fixed (<sha>)`.

---

### Task 10: Full re-run, report and release gate

**Files:**
- Modify: `docs/qa-results/2026-11-09.md` (final results)
- Modify: `TESTING.md` (new specs, `e2e/.env`, the "Still open" list)
- Create: the owner's report page (published as a private Artifact from the scratchpad, not committed)

- [ ] **Step 1: Re-run everything**

Re-run every automated suite (Task 2's commands) and the full E2E set: `npx playwright test` with `E2E_PLACE_ORDER=1`.
Expected: green, apart from cases recorded as Blocked or Not run with their reasons.

- [ ] **Step 2: Publish the report**

The report has:
- totals per app (Pass, Fixed, Blocked, Not run);
- every fix, with a one-line buyer- or seller-visible effect;
- every Blocked case, with what would unblock it;
- the owner questions still open;
- the commands to re-run the suites.

- [ ] **Step 3: Commit, push, notify**

```bash
git add docs TESTING.md && git commit -m "docs: QA results for 2026-11-09 production readiness run"
```
Push to `main`. Update project memory with what was learned that the repo doesn't record.

- [ ] **Step 4: Ask before releasing to production**

Ask the owner for the go-ahead. On yes, run `git push origin main:production` (a fast-forward since 2026-11-09), watch "Deploy to DigitalOcean (production)", then run the read-only smoke checks: `/health` 200; `https://maretinda.com/ph` 200; a guest cart with HELLOMRTD gets `Sign in to use this first-order voucher`.
