# Next release (on `main`, not yet in production)

> **Do not push to `production` without the owner's OK.** `main` now carries
> the return, refund and cancellation process, built from the team's 24
> November *proposal*. The proposal says to finalise the policy before it goes
> live, and the owner hasn't approved it yet. Ask before releasing, even for an
> unrelated fix (cherry-pick that fix to `production` instead).

## Returns, refunds and cancellations (on test from 27 November)

- **Buyers** ask within 7 days of delivery from the order page: the items, how
  many, one of six reasons, photos with the waybill in view (plus an unboxing
  video for damaged, defective or incomplete items), and a GCash, Maya or bank
  account for the refund. They follow the case on the order, send the item
  back with its tracking number, escalate a dispute, and see the refund's
  reference and receipt once it's sent. Paid-online orders can ask to be
  cancelled before they ship. New page `/returns-policy`; help center updated.
- **Sellers** answer each return in 48 hours (take it back, refund only, or
  dispute with proof) or it's approved for the buyer, and check a returned
  item within 48 hours. Requests → the return shows the buyer's proof, the
  deadline and the steps. Payouts & Invoices shows charges from refunds and
  the security deposit.
- **Admin → Returns & Refunds:** escalated returns to decide (with fault),
  refunds to send and sent (logged with reference, amount, date and receipt),
  and cancellation requests. A failed delivery is recorded on the order page.
  The seller page shows the deposit and what the shop owes, with waive.
- What a shop owes is kept from its next payouts and COD remittances; anything
  left after 14 days comes from its security deposit (off until
  `SELLER_SECURITY_DEPOSIT_MIN` is set).

## Forgot and reset password pages (on test from 28 November)

- Both pages now match sign-in and sign-up: the same card and fields, an
  email typed on sign-in carried over, a "Check your email" view with Send
  again after 30 seconds, a live password checklist, and a clear message
  when a reset link is incomplete, expired or already used. English and
  Filipino. Storefront only (commit ca5662af). Cherry-picked to
  `production` on 28 November (3c0b4b25).

## Also cherry-picked to production on 28 November

None of these touch the returns work, so they went live without it.

- **Account button.** Signed out, it goes straight to sign-in; the hover menu
  only repeated what that page offers and opened over the search bar. Signed
  in, the menu opens under the button, towards the icons beside it.
- **Confirming an email in another browser or on another phone.** The confirm
  page used to say "You can now place orders" and offer the cart to a browser
  that wasn't signed in. It now asks to sign in with that email (filled in),
  or says which account the browser is signed in to. The link still doesn't
  sign anyone in. Where the buyer is signed in, the "confirm your email" notice
  at checkout and on the account page picks up the confirmation within about
  10 seconds, without a reload.
- **Plans (owner's decision, 28 November).** The first month is free on
  **Growth only**. Starter (₱499 a month) and Premium (₱3,999) are paid from
  the first day. Trials already running keep their end date. The **AI seller
  agent** is a Premium feature, shown as coming soon; the separate Enterprise
  card is gone from the seller panel. The seller website shows the real
  prices, monthly and yearly (₱4,990 / ₱14,990 / ₱39,990). Storefront,
  seller panel, approval email, help center, chat answers and assistant
  knowledge all say the same.
  - Migration `1771900000000_growth_first_month_free` runs on deploy: trial
    days 30 on Growth and 0 on Starter and Premium, and `ai_agent:
    "coming_soon"` in Premium's features. An admin can still change trial
    days in Admin → Subscriptions.
  - Where the support assistant is switched on, re-run `assistant:index`:
    its plan knowledge changed.
- **Booking a courier: places from the carrier's own list** (main 7857cb34,
  production 22065119). Flying Tigers refused bookings like City "Metro
  Manila" in province "Metro Manila": it books only to the cities on its
  covered list, by code, and lists the City of Manila by district. The
  booking form's Province → City → Barangay now come from the chosen
  carrier: Flying Tigers' covered lists, or the full Philippine list for a
  carrier without one, matched again when the carrier changes. The order's
  typed address is matched for the seller ("City of Makati" → Makati City,
  "NCR" → Metro Manila, a Manila barangay → its district), and anything not
  on the list is explained by the field. Booking sends Flying Tigers its own
  codes and refuses a city it doesn't list before calling it. New route
  `GET /vendor/shipping-providers/:provider_id/areas`. No migration.
- **Order progress on the order and return pages** (main cb313af4,
  production bafe1463). The four steps were stacked on top of each other with
  their lines running across the card, in a blue from the old template. They
  sit side by side again, in the brand purple: done steps ticked, the
  current one ringed.

## Before production

1. Owner finalises the policy: deposit amount, processing fee
   (`PAYMENT_PROCESSING_RATE`, 2.5% for now), who books return couriers, and
   two assumed rules (an unconfirmed returned parcel counts as received 7 days
   after the buyer's tracking; a return not sent in 5 days closes).
2. Migration `1771100000000_returns_and_refunds` runs on deploy. It adds tables
   only and soft-deletes the old return reasons in favour of the policy's six.
3. Give the people who decide returns the Support role, and those who send
   refunds and record deposits the Finance role.
4. Check one return end to end on test (e2e RET-01 does it:
   `tests/seller/returns.writes.spec.ts`).

See `deploy/README.md` → Returns, refunds and cancellations.
