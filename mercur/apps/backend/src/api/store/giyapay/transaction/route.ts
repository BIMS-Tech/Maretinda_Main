import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const q: any = req.query || {}
    const reference = q.reference_number || q.refno || q.reference || q.ref
    const orderId = q.order_id || q.orderId

    if (!reference && !orderId) {
      return res.status(400).json({ error: "order_id or reference_number is required" })
    }

    // Resolve pg connection
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      // @ts-ignore
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      return res.status(500).json({ error: "Database connection not available" })
    }

    const whereParts: string[] = []
    const params: any[] = []
    if (orderId) { whereParts.push("order_id = ?"); params.push(orderId) }
    if (reference) { whereParts.push("reference_number = ?"); params.push(reference) }
    const where = whereParts.length ? `WHERE ${whereParts.join(" OR ")}` : ""

    // Ensure table exists (idempotent)
    await pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS giyapay_transactions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid()),
        reference_number VARCHAR(255) UNIQUE NOT NULL,
        order_id VARCHAR(255),
        cart_id VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'PHP',
        status VARCHAR(20) DEFAULT 'PENDING',
        gateway VARCHAR(50) DEFAULT 'GCASH',
        description TEXT,
        payment_data JSONB,
        vendor_id VARCHAR(255),
        vendor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const sql = `SELECT * FROM giyapay_transactions ${where} ORDER BY created_at DESC LIMIT 1`
    const result = await pgConnection.raw(sql, params)
    const row = Array.isArray(result?.rows) ? result.rows[0] : (result?.[0] || null)

    if (!row) {
      return res.status(404).json({ error: "Transaction not found" })
    }

    let paymentData: any = null
    try {
      paymentData = typeof row.payment_data === 'string' ? JSON.parse(row.payment_data) : row.payment_data
    } catch {
      paymentData = null
    }

    return res.json({
      referenceNumber: row.reference_number,
      orderId: row.order_id,
      cartId: row.cart_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      gateway: row.gateway,
      description: row.description,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      paymentData,
      createdAt: row.created_at,
    })
  } catch (e: any) {
    console.error('[GiyaPay Store Transaction] Error:', e)
    return res.status(500).json({ error: 'Failed to fetch transaction', message: e.message })
  }
}





































