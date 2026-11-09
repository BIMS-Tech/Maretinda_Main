# Production readiness: test everything, fix what breaks

Project 1 of 3, agreed 2026-11-09. Then (2) subscriptions cross-check across store, seller panel and admin, and (3) the seller panel redesign. Each gets its own design.

## Why

Maretinda is live at maretinda.com with real buyers and sellers. The owner wants to trust that every journey on the storefront, seller panel and admin panel works and can't be abused, before more sellers join and before the seller panel is redesigned. Today that trust rests on fixes made one bug report at a time.

## What success looks like

- Every case in [docs/qa-test-cases.md](../../qa-test-cases.md) has been run on the test environment and marked Pass, Fail or Blocked, against a named commit.
- Every P1 failure is fixed, has an automated test that would have caught it, and passes on test.
- All automated suites are green: backend unit, backend integration (including the `security-*` attack suites), storefront unit, seller/admin unit, browser E2E.
- A results report for the owner lists what was tested, what was fixed, what's blocked and why, and what's left. Published as a private page they can share.
- The browser and API scripts written along the way are kept in the repo, so the whole check can be re-run before any release.

## Goals

1. **Run what already exists:** all suites in [TESTING.md](../../../TESTING.md), including the E2E write specs on test.
2. **Work through the manual QA list** on test. Automate each case with Playwright or API scripts where possible, so it is repeatable. Do by hand only what can't be scripted.
3. **Fill the gaps in the QA list.** Add cases for journeys it doesn't cover yet, at least:
   - the home page top-sellers row and its carousel dots (reported broken);
   - seller payouts and the settlement report;
   - returns from the seller's side;
   - the 3D model tab;
   - reels moderation;
   - help center chat;
   - account deletion, if it exists;
   - every voucher message added on 2026-11-09.
4. **Attack it:** extend the `security-*` suites wherever a route lacks an ownership check (the access suite only catches missing auth). Repeat the browser abuse checks (SEC-01 to SEC-07).
5. **Fix and verify:** fix each bug found with a test first, push to `main` (deploys test), and re-run the affected cases.
6. **Fill unit-test gaps:** the seller and admin panels only test translations today. Add unit tests for the logic that the bugs found here touch, not for every screen. The redesign (project 3) will rewrite most screens.

## Non-goals

- The mobile app (`maretinda-mobile`) and the marketing website.
- Load or stress testing. Light page-speed notes are fine, but no traffic generation against either server.
- Redesigning anything: UI changes are limited to what a fix needs.
- New features. The paused delivery-estimate feature stays paused, so it gets no test cases.

## Anti-goals (a failure even if every test passes)

- Any write to production, real email to people who didn't sign up, a real courier booking, or a real-money payment.
- Changing how a feature behaves for buyers or sellers without asking: pricing, voucher rules, trial length, what a plan unlocks.
- Tests that pass by being loosened, or bugs marked "Blocked" to make the numbers look better.

## Constraints

- **Environment:**
  - Test runs on Oracle (`deploy@213.35.117.254`, `https://test-api.maretinda.com`).
  - Frontends are on Vercel: teststore, testseller and testadmin `.maretinda.com`, built from `main`.
  - Pushing to `main` deploys both, in about 5 minutes for the backend.
  - The test data is a scrubbed copy of production.
- **Production:**
  - Production reads are allowed, and only in read-only transactions.
  - Releasing fixes to `production` happens once at the end of the project, after the owner says yes.
  - `main` and `production` share history since 2026-11-09, so a release is a fast-forward push.
- **Couriers:** Flying Tigers has no sandbox. Never submit a valid booking; test up to validation only. Couriers are switched off on test by the scrub; check before any shipping test and stop if one is on.
- **GiyaPay:** test is in sandbox mode (checked 2026-11-09). Re-check before paying, and never pay if it's off.
- **Email:**
  - Test sends real email through Resend.
  - Test signups use Resend's test inboxes (`delivered+<label>@resend.dev`), which accept mail without hurting the sender reputation.
  - Email content is checked through the Resend API's sent-email log (read-only).
- **Uploads:** image and video uploads fail on test because test has no storage bucket (`S3_*` unset). The cases affected are marked Blocked until a test R2 bucket exists.
- **Search:** test's backend has no Algolia app configured, so search indexing can't be tested on test. Search results are checked read-only against production.
- **Accounts:**
  - Use a test-only admin and test-only sellers created on test (`medusa user`, seller signup plus admin approval).
  - Never use the owner's own admin login.
  - Their passwords stay out of the repo, in a local env file the E2E specs read.
- **Probing third parties:** only read-only endpoints. See the no-probing rule in project memory.
- **Money:** Medusa amounts are pesos everywhere except the hero card, which uses centavos.

## Decided

- **Order:** testing and fixes first, then subscriptions, then the redesign. Agreed with the owner.
- **Clear bugs:** fix them and ship them to test as I go.
- **Behaviour changes:** anything that changes how a feature behaves is asked first, batched into one question round where possible.
- **Results:** the results report is the deliverable, alongside the fixes.

## Left to the builder

- Which cases to automate versus run by hand.
- How to organise new E2E specs, following `e2e/tests/{store,seller,admin}`.
- Fix order within a priority level.
- New QA case IDs, continuing each section's numbering.

## Open with the owner

1. **Test uploads:** create a test R2 bucket and token now, so the upload, reel and seller-document cases can run, or leave those cases Blocked.
2. **Google sign-in (ACC-05):** it needs a real Google account in a browser. I'll test up to Google's consent screen, and the owner confirms the last step by hand.
