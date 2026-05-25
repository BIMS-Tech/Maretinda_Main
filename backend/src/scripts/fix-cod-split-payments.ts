import { Client } from 'pg'
import * as dotenv from 'dotenv'

/**
 * One-time fix for COD split order payments.
 *
 * The @mercurjs/b2c-core subscriber `split-payment-payment-captured` fires on
 * every PaymentEvents.CAPTURED — including pp_system_default auto-captures for
 * COD orders — and incorrectly marks split_order_payment.captured_amount to the
 * full order total. This script resets those records so the vendor panel shows
 * "Awaiting" instead of "Captured" for COD orders.
 *
 * Safe to run multiple times (idempotent). Does NOT affect orders where the
 * vendor has already used the capture button, since those are reset by the
 * ongoing reset-cod-split-payment subscriber.
 *
 * Usage: npm run fix:cod
 */

dotenv.config()

async function fixCodSplitPayments() {
  // DATABASE_URL may contain $DB_NAME which dotenv does not expand automatically
  let dbUrl = process.env.DATABASE_URL || ""
  if (process.env.DB_NAME) {
    dbUrl = dbUrl.replace("$DB_NAME", process.env.DB_NAME)
  }
  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    console.log('Connected to database')

    // Identify affected COD split order payments
    const { rows: affected } = await client.query(`
      SELECT sop.id, sop.captured_amount, o.display_id, p.id AS payment_id
      FROM split_order_payment sop
      JOIN payment_collection pc ON pc.id = sop.payment_collection_id
      JOIN payment p ON p.payment_collection_id = pc.id
      JOIN order_payment_collection opc ON opc.payment_collection_id = pc.id
      JOIN "order" o ON o.id = opc.order_id
      WHERE p.provider_id = 'pp_system_default'
        AND p.deleted_at IS NULL
        AND pc.deleted_at IS NULL
        AND sop.deleted_at IS NULL
        AND (sop.captured_amount > 0 OR p.status = 'captured')
    `)

    if (affected.length === 0) {
      console.log('No COD split order payments need fixing. All good!')
      return
    }

    console.log(`Found ${affected.length} COD split order payment(s) to fix:`)
    for (const row of affected) {
      console.log(`  Order #${row.display_id} — split_payment ${row.id}, captured_amount was ${row.captured_amount}`)
    }

    const ids = affected.map((r: any) => r.id)
    const placeholders = ids.map((_: any, i: number) => `$${i + 1}`).join(', ')

    // Reset split_order_payment records
    await client.query(`
      UPDATE split_order_payment
      SET
        captured_amount     = 0,
        raw_captured_amount = '{"value": "0", "precision": 20}',
        status              = 'pending',
        updated_at          = NOW()
      WHERE id IN (${placeholders})
    `, ids)

    // Also reset the core payment records — these drive the "Captured" badge in the UI
    const paymentIds = affected.map((r: any) => r.payment_id)
    const uniquePaymentIds = [...new Set(paymentIds)].filter(Boolean)
    if (uniquePaymentIds.length > 0) {
      const paymentPlaceholders = uniquePaymentIds.map((_: any, i: number) => `$${i + 1}`).join(', ')
      await client.query(`
        UPDATE payment
        SET
          status              = 'authorized',
          captured_amount     = 0,
          raw_captured_amount = '{"value": "0", "precision": 20}',
          captured_at         = NULL,
          updated_at          = NOW()
        WHERE id IN (${paymentPlaceholders})
          AND status = 'captured'
      `, uniquePaymentIds)
    }

    console.log(`\nReset ${affected.length} COD split order payment(s) to captured_amount = 0, status = pending.`)
    console.log(`Reset ${uniquePaymentIds.length} COD payment record(s) to status = authorized.`)
    console.log('Done! Vendor panel will now show the correct status for these COD orders.')

  } catch (err) {
    console.error('Error fixing COD split payments:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

fixCodSplitPayments().catch(console.error)
