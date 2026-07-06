import { Client } from 'pg'
import * as dotenv from 'dotenv'

/**
 * One-time repair for COD orders that were wrongly auto-captured.
 *
 * The @mercurjs/b2c-core subscriber `order-set-placed-payment-capture` runs
 * capturePaymentWorkflow on EVERY order at placement — including
 * pp_system_default (COD) — which marks payment_collection.captured_amount +
 * status = completed and records a capture. That makes COD orders read as
 * "Captured" when they should be "Authorized" (awaiting cash on delivery).
 *
 * This script reverses the capture across ALL the tables Medusa/mercur derive
 * status from: payment_collection (drives the order badge), payment.captured_at,
 * the capture record, and split_order_payment (seller split view).
 *
 * Safe to run multiple times (idempotent). NOTE: it resets every captured COD
 * order, so if a seller has genuinely collected cash for one, re-capture it via
 * the seller "capture" button afterwards.
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

    // Identify captured COD orders that need reversing
    const { rows: affected } = await client.query(`
      SELECT DISTINCT p.id AS payment_id, pc.id AS payment_collection_id, o.display_id
      FROM payment p
      JOIN payment_collection pc ON pc.id = p.payment_collection_id
      JOIN order_payment_collection opc ON opc.payment_collection_id = pc.id
      JOIN "order" o ON o.id = opc.order_id
      LEFT JOIN split_order_payment sop ON sop.payment_collection_id = pc.id AND sop.deleted_at IS NULL
      WHERE p.provider_id = 'pp_system_default'
        AND p.deleted_at IS NULL
        AND pc.deleted_at IS NULL
        AND (
          pc.captured_amount > 0
          OR pc.status = 'completed'
          OR p.captured_at IS NOT NULL
          OR sop.captured_amount > 0
          OR sop.status = 'captured'
        )
    `)

    if (affected.length === 0) {
      console.log('No captured COD orders need fixing. All good!')
      return
    }

    console.log(`Found ${affected.length} captured COD order(s) to reset:`)
    for (const row of affected) {
      console.log(`  Order #${row.display_id} — payment ${row.payment_id}`)
    }

    const zeroRaw = JSON.stringify({ value: "0", precision: 20 })

    for (const row of affected) {
      // 1. payment_collection — drives the order payment badge
      await client.query(`
        UPDATE payment_collection
        SET status = 'authorized', captured_amount = 0, raw_captured_amount = $1,
            completed_at = NULL, updated_at = NOW()
        WHERE id = $2
      `, [zeroRaw, row.payment_collection_id])

      // 2. clear the capture timestamp on the payment row
      await client.query(`
        UPDATE payment SET captured_at = NULL, updated_at = NOW() WHERE id = $1
      `, [row.payment_id])

      // 3. soft-delete the capture record(s)
      await client.query(`
        UPDATE capture SET deleted_at = NOW(), updated_at = NOW()
        WHERE payment_id = $1 AND deleted_at IS NULL
      `, [row.payment_id])

      // 4. reset the mercur split_order_payment (seller split view)
      await client.query(`
        UPDATE split_order_payment
        SET status = 'pending', captured_amount = 0, raw_captured_amount = $1, updated_at = NOW()
        WHERE payment_collection_id = $2 AND deleted_at IS NULL
      `, [zeroRaw, row.payment_collection_id])
    }

    console.log(`\nReset ${affected.length} COD order(s) to authorized (awaiting cash).`)
    console.log('Done! The seller panel and order list will now show the correct status.')

  } catch (err) {
    console.error('Error fixing COD payments:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

fixCodSplitPayments().catch(console.error)
