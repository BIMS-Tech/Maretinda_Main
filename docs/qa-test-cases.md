# Maretinda manual QA test cases

Run these on the **test environment** before promoting `main` to `production`.

| App | URL |
| --- | --- |
| Storefront | https://teststore.maretinda.com |
| Seller panel | https://testseller.maretinda.com |
| Admin panel | https://testadmin.maretinda.com |
| API | https://test-api.maretinda.com |

## Before you start

- **Use a mailbox you own** for every signup (e.g. `you+qa-buyer1@gmail.com`). The test environment sends real email through Resend.
- **Don't book couriers.** Flying Tigers has no sandbox: a booking on test is a real pickup. Couriers are switched off by the data scrub, so check that **Admin → Shipping providers** shows them disabled before testing shipping. If one is enabled, stop and ask.
- **GiyaPay:** check **Admin → GiyaPay** shows *Sandbox mode* on before paying online. If it's off, don't pay.
- **Uploads:** image and video uploads fail on test until the test R2 bucket exists. Mark upload cases *Blocked* rather than *Fail* if that's the only cause.
- The first page load can take up to 90 seconds (cold start). That isn't a bug unless it happens on a warm page.

Mark each case **Pass / Fail / Blocked** and note the build (commit on `main`) you tested.

Priority: **P1** = blocks release · **P2** = fix soon · **P3** = minor.

---

## 1. Customer account

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| ACC-01 | P1 | Register | Storefront → Login → create account with a new email, password and PH mobile | Account created and you're signed in. A welcome email arrives. |
| ACC-02 | P1 | Login / logout | Log out, log back in with the same credentials | Signed in; header shows the account menu. Logging out returns you to a signed-out header. |
| ACC-03 | P1 | Wrong password | Log in with a correct email and wrong password | Error message; you stay on the login page. |
| ACC-04 | P2 | Forgot password | Login → Forgot password → enter email → follow the email link → set a new password | Reset email arrives; the new password works and the old one doesn't. |
| ACC-05 | P2 | Google sign-in | Login → Continue with Google | Signed in with the Google account's email; repeating it logs into the same account rather than creating a duplicate. |
| ACC-06 | P2 | Addresses | Account → Addresses → add, edit, delete an address | Changes persist after a page reload. |
| ACC-07 | P2 | Wishlist add/remove | On a product, tap the heart; open Account → Wishlist; remove it | The heart fills right away and the item appears in the wishlist; removing it updates the page without a reload. |
| ACC-08 | P3 | Settings | Account → Settings → change name/phone | Saved and shown after reload. |

## 2. Browsing and product pages

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| BRW-01 | P1 | Home page | Open the storefront | Redirects to `/ph`. Hero, categories, trending, reels, collections and top sellers all render. |
| BRW-02 | P1 | Search | Type "shirt" in the header search and press Enter | Goes to `/categories?query=shirt` and lists matching products. |
| BRW-03 | P1 | Product page | Open any product | Title, ₱ price, images, variant picker and **Add to Cart** show. |
| BRW-04 | P1 | Product tabs | On a product, open Product Details, Ratings & Reviews, Shipping & Returns | Each tab opens; no crash (Details used to crash on products with object metadata). |
| BRW-05 | P2 | Sale price | Open a product in an active flash sale | Sale price and struck-through original match the flash-sale banner and the home hero card. |
| BRW-06 | P2 | Share | Product → Share | Desktop: menu starts with **Copy link**; copying gives a clean URL that keeps the selected variant. Mobile: the phone's share sheet opens. Messenger only appears if the Facebook app id is configured. |
| BRW-07 | P2 | Seller page | Open a seller from Top local sellers | Seller profile, products, reels and reviews tabs load. A verified seller shows the Verified badge. |
| BRW-08 | P2 | Categories and collections | Open All Categories, a sub-category and a collection | Products listed; sorting by price ascending/descending orders by cheapest variant. |
| BRW-09 | P2 | Reels feed | Open Reels; play, like, scroll | Videos play; likes stick after reload when signed in. |
| BRW-10 | P3 | Home trust badges | Click Buyer protection, Shipping and Payment badges on the home page | Each opens the matching Help Center section. |
| BRW-11 | P3 | Help center | Open Help Center; play a tutorial video | Sections and FAQs render; videos play (unlisted YouTube). No emoji in the UI. |
| BRW-13 | P2 | Search on a phone | On a phone (or a browser narrower than 1024px), look for product search | A search box shows under the header and submitting it lists matching products. |
| BRW-12 | P3 | Support assistant | Open chat support and ask "how much does it cost to sell?" | The answer mentions a flat monthly subscription and **first month free**, never a commission. |

## 3. Cart, vouchers and checkout

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| CHK-01 | P1 | Add to cart | Add a product, change quantity, remove it | Cart count and totals update; totals are in pesos (₱1,499 shows as ₱1,499, not ₱14.99 or ₱149,900). |
| CHK-02 | P1 | Guest checkout gate | Signed out, open the cart | Shows **Login to checkout**. |
| CHK-03 | P1 | Shipping cost | Checkout → enter a PH address → pick a shipping option | A shipping fee appears. Sanity-check it: a 0.5 kg item on Standard should be about ₱85. |
| CHK-04 | P1 | Product without weight | Add a product whose seller left weight empty, then go to checkout | Checkout explains the product has no weight set instead of failing silently. |
| CHK-05 | P1 | COD order | Place an order with Cash on Delivery | Lands on the confirmation page showing **Cash on Delivery** (not "Online Payment"). Buyer gets an order email; the seller gets a new-order email. |
| CHK-06 | P1 | COD payment status | Admin → Orders → the COD order | Payment reads **Authorized** (awaiting cash), not Captured. |
| CHK-07 | P1 | GiyaPay order (sandbox only) | Check sandbox mode is on, then pay with GCash/card through GiyaPay | Redirects back to the confirmation page showing the GiyaPay method; Admin → GiyaPay → Transactions lists it with the right amount in pesos and the right seller. |
| CHK-08 | P1 | GiyaPay cancel | Start a GiyaPay payment and cancel on GiyaPay's page | Returns to the payment-cancel page; no paid order is created. |
| CHK-09 | P2 | Multi-seller cart | Add products from two sellers, check out with COD | One confirmation, one order per seller; each seller gets only their own order email. |
| CHK-10 | P2 | Collect a voucher | Vouchers page → Collect | Shows as collected and appears in Account → Vouchers. Collecting twice doesn't duplicate it. |
| CHK-11 | P2 | Apply a voucher | In the cart, choose a collected voucher that meets the minimum | Discount applied to the total. A voucher whose min. order is above the cart total shows "not available" with the right minimum in ₱. |
| CHK-12 | P2 | First-order voucher | With an account that already has an order, try to collect the ₱100 first-order voucher | Blocked with "only for first-time buyers", both when collecting and when typing the code at checkout. |
| CHK-13 | P2 | Seller voucher | On a seller's page, open their vouchers | Only that seller's vouchers show, and applying one only discounts that seller's items. |
| CHK-14 | P2 | Order history | Account → Orders → open the order | Status, items, totals and payment method match the confirmation page. |
| CHK-15 | P3 | Return request | On a delivered order, request a return | Request-success page; the seller sees the request. |

## 4. Seller onboarding and verification

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| SEL-01 | P1 | Seller registration | Seller panel → Register → answer each chat step | Application submitted and shown as pending. Can't reach the dashboard until approved. |
| SEL-02 | P1 | Admin approval | Admin → Requests / Seller applications → approve the seller | Seller can now sign in and reaches the dashboard. |
| SEL-03 | P1 | Seller login / wrong password | Sign in; then try a wrong password | Correct: dashboard. Wrong: error, stays on login. |
| SEL-04 | P1 | Business verification | Settings → Store → enter TIN and upload every document required for your organization type | Status becomes **Pending review**. Removing a document drops it back to Unverified. |
| SEL-05 | P1 | Verify seller | Admin → Seller verifications → verify | Storefront seller page and products show the Verified badge. Editing details as the seller afterwards keeps the seller Verified. |
| SEL-06 | P2 | Reject and resubmit | Admin rejects; seller fixes documents | Rejected → Pending review after the seller completes the documents again. |

## 5. Seller catalog and orders

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| SOP-01 | P1 | Create product | Products → Create, with price, stock, **weight** and images | Product appears on the storefront (after search indexing) with the right ₱ price. |
| SOP-02 | P1 | New order | After CHK-05, open Orders in the seller panel | The order is listed with the buyer's items and a pending COD payment. |
| SOP-03 | P1 | Mark COD paid | Open the COD order → mark payment received | Seller and admin both show **Captured**. |
| SOP-04 | P1 | Other seller's order | As seller B, try to mark seller A's COD order paid (needs the order id) | Refused with "not found"; the order stays unpaid. |
| SOP-05 | P1 | Fulfil an order | Create a fulfillment and mark shipped / delivered | Buyer's order page progresses Received → Preparing → Shipped → Delivered. |
| SOP-06 | P2 | Shipping order phone validation | Create a shipment where the buyer phone is a landline | Clear error asking for a 09XX / +63 9XX mobile. **Don't submit a valid booking** (see "Before you start"). |
| SOP-07 | P2 | Reels | Reels → upload a short video, publish | Plays on the seller's storefront reels tab and in the Reels feed. (Blocked until test uploads work.) |
| SOP-08 | P2 | Flash sale | Flash sales → submit an item; admin approves; sale goes live | Item shows the sale price on the storefront during the sale window only. |
| SOP-09 | P2 | Seller promotion | Promotions → create a voucher | Shows on the seller's storefront page and can be collected. |
| SOP-10 | P3 | Messages | Buyer messages the seller from a product; seller replies | Both sides see the thread in real time. |

## 6. Subscriptions and plan gating

Plans: Starter ₱499/mo, Growth ₱1,499/mo, Premium ₱3,999/mo, yearly 17% off. Marketing copy says **first month free**; the database currently grants a **7-day** trial (`subscription_plan.trial_days = 7`). Report any page that shows a different trial length.

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| SUB-01 | P1 | Plans page | Seller panel → Subscription | Three plans with the prices above; monthly/yearly toggle shows the yearly price. |
| SUB-02 | P1 | Start trial | New seller → start the free trial on Growth | Active; the countdown shows the days left. |
| SUB-03 | P1 | Second trial | Same seller tries another trial | Refused: "Trial has already been used". |
| SUB-04 | P1 | Paid renewal (sandbox only) | Subscribe to Starter monthly through GiyaPay sandbox | Returns to /subscription with the plan active for one month; Admin → Subscriptions shows it with the GiyaPay reference. Refreshing the return page doesn't create a second subscription. |
| SUB-05 | P1 | Expiry | Admin ends a seller's trial (Admin → Subscriptions → End trial) | The seller immediately loses plan features and sees the expired state. |
| SUB-06 | P2 | Admin assign | Admin → Subscriptions → assign Premium for 90 days | Old plan cancelled, Premium active with the right end date. |
| SUB-07 | P2 | Extend trial | Admin → extend a trial by 10 days | End date moves out 10 days; the seller's countdown updates. |
| SUB-08 | P2 | 3D model gating | As Starter, open a product's 3D Model tab; then as Growth/Premium | Starter: locked with an upgrade prompt. Growth/Premium: generator available. |

## 7. Admin

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| ADM-01 | P1 | Login | Admin → log in with the test admin | Dashboard loads. Wrong password shows an error. |
| ADM-02 | P1 | Orders list | Orders | Lists orders with correct payment badges (COD Authorized until the seller marks it paid). |
| ADM-03 | P2 | Storefront hero | Store front → edit hero copy and featured product | Storefront hero updates; the featured product price matches the product page (no ₱88,000 → ₱880 mismatch). |
| ADM-04 | P2 | Promotions | Create a platform promotion with a minimum order | Shows on the storefront vouchers page with "Min. order ₱X" matching what you entered. |
| ADM-05 | P2 | Reports / settlement | Reports → generate a settlement report | File downloads and totals match the period's orders. |

---

## 8. Abuse checks

The automated security suites cover these at the API level. Repeat them once in a real browser after each deploy.

| ID | P | Case | Steps | Expected |
| --- | --- | --- | --- | --- |
| SEC-01 | P1 | Leave checkout without paying | Start a GiyaPay payment, cancel on GiyaPay's page, then reload checkout and try to place the order | No order is created. The cart is still there. |
| SEC-02 | P1 | Reuse a payment | After a GiyaPay order, go back to the success URL and reload it | "Already used" or the same order. No second order. |
| SEC-03 | P1 | Script in a description | As a seller, save a product description containing `<img src=x onerror=alert(1)>` and view it on the storefront | No popup. The rest of the text displays normally. |
| SEC-04 | P1 | Login redirect | Open `/login?returnTo=https://example.com` and sign in | You land on your account page, not example.com. |
| SEC-05 | P2 | Password guessing | Enter a wrong password 11 times in a row for one account | "Too many requests" from about the 11th try. A different account still works. |
| SEC-06 | P2 | Disguised upload | Rename an HTML file to `.png` and upload it as a seller document | Rejected. |
| SEC-07 | P2 | Seller promotion scope | As a seller, create a voucher and apply it to a cart holding items from two sellers | Only that seller's items are discounted. |

---

## Known issues

See the "Still open" list in [TESTING.md](../TESTING.md).
