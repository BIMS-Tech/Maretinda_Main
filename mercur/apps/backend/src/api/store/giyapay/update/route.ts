import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Update] Incoming body:', (req as any).body)
    // Express-style body parsing in Medusa
    // @ts-ignore
    const body = (req as any).body || {}
    const {
      reference_number,
      referenceNumber,
      order_id,
      orderId,
      cart_id,
      cartId,
      gateway,
      vendor_id,
      vendorId,
      vendor_name,
      vendorName,
      description,
      payment_data,
    } = body || {}

    const ref = reference_number || referenceNumber
    const ord = order_id || orderId
    const crt = cart_id || cartId
    if (!ref && !ord && !crt) {
      return res.status(400).json({ error: "reference_number, order_id or cart_id is required" })
    }

    // Resolve pg connection
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      // Fallbacks
      // @ts-ignore
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      return res.status(500).json({ error: "Database connection not available" })
    }

    // Ensure table exists and columns exist
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

    await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS cart_id VARCHAR(255)`)    
    await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255)`)  
    await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`)  

    // Build update set
    const sets: string[] = []
    const params: any[] = []
    if (ord) { sets.push(`order_id = ?`); params.push(ord) }
    if (gateway) { sets.push(`gateway = ?`); params.push(String(gateway).toUpperCase()) }
    if (vendor_id || vendorId) { sets.push(`vendor_id = ?`); params.push(vendor_id || vendorId) }
    if (vendor_name || vendorName) { sets.push(`vendor_name = ?`); params.push(vendor_name || vendorName) }
    if (description) { sets.push(`description = ?`); params.push(description) }
    if (crt) { sets.push(`cart_id = ?`); params.push(crt) }
    if (payment_data) { sets.push(`payment_data = ?`); params.push(JSON.stringify(payment_data)) }

    if (sets.length === 0) {
      return res.status(200).json({ updated: 0, message: "No fields to update" })
    }

    // Match by priority: reference_number, then order_id, then cart_id
    let where = "reference_number = ?"
    let whereParam: any = ref
    if (!whereParam && ord) { where = "order_id = ?"; whereParam = ord }
    if (!whereParam && crt) { where = "cart_id = ?"; whereParam = crt }

    // Try update by reference_number first (if provided), then fallback to order_id, then cart_id
    let updated = 0
    const attempts: Array<{ clause: string; value: any }> = []
    if (ref) attempts.push({ clause: 'reference_number = ?', value: ref })
    if (ord) attempts.push({ clause: 'order_id = ?', value: ord })
    if (crt) attempts.push({ clause: 'cart_id = ?', value: crt })
    // Fallback: early rows used cart_id (Giayapay cart) as reference_number
    if (crt) attempts.push({ clause: 'reference_number = ?', value: crt })

    for (const attempt of attempts) {
      const sql = `UPDATE giyapay_transactions SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE ${attempt.clause}`
      const result = await pgConnection.raw(sql, [...params, attempt.value])
      const affected = (result && (result.rowCount ?? 0)) || 0
      console.log('[GiyaPay Update] SQL:', sql, 'params:', [...params, attempt.value], 'affected:', affected)
      updated += affected
      if (affected > 0) break
    }

    return res.status(200).json({ updated })
  } catch (e: any) {
    console.error('[GiyaPay Update] Error:', e)
    return res.status(500).json({ error: "Failed to update transaction", message: e.message })
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const q: any = req.query || {}
    const payload = {
      // expected by POST handler (camelCase)
      referenceNumber: q.reference_number || q.refno || q.ref || undefined,
      orderId: q.order_id || undefined,
      cartId: q.cart_id || undefined,
      gateway: q.gateway || q.channel || q.provider || q.payment_method || undefined,
      vendorId: q.vendor_id || undefined,
      vendorName: q.vendor_name || undefined,
      description: q.description || undefined,
    } as any
    // Reuse POST logic by faking body
    // @ts-ignore
    ;(req as any).body = payload
    return await POST(req, res)
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to process update (GET)', message: e.message })
  }
}


