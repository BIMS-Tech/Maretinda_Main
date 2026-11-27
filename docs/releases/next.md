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
