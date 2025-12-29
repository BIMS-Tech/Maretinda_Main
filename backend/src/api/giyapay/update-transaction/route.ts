import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import GiyaPayService from "../../../services/giyapay"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Update Transaction] Update request received')
    
    const { reference_number, order_id, cart_id } = req.body as any
    
    if (!reference_number) {
      console.error('[GiyaPay Update Transaction] Missing reference_number')
      return res.status(400).json({ 
        success: false, 
        message: 'Missing reference_number' 
      })
    }

    // Get GiyaPay service
    const container = req.scope
    let giyaPayService: any
    
    try {
      giyaPayService = container.resolve("giyaPayService") as any
    } catch (error) {
      console.log('[GiyaPay Update Transaction] Creating fallback GiyaPay service')
      giyaPayService = new GiyaPayService(container)
      container.register({
        giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
      })
    }

    if (!giyaPayService) {
      console.error('[GiyaPay Update Transaction] GiyaPay service not found')
      return res.status(500).json({ 
        success: false, 
        message: 'Service not available' 
      })
    }

    // Update transaction with real order ID and cart ID
    await giyaPayService.updateTransactionStatus(
      reference_number, 
      'SUCCESS', 
      order_id
    )
    
    const manager = await (giyaPayService as any).getManager()
    
    // Also update cart_id if provided
    if (cart_id) {
      try {
        await manager.raw(
          'UPDATE giyapay_transaction SET cart_id = ?, updated_at = NOW() WHERE reference_number = ?',
          [cart_id, reference_number]
        )
        console.log('[GiyaPay Update Transaction] Cart ID updated:', cart_id)
      } catch (cartUpdateError) {
        console.log('[GiyaPay Update Transaction] Failed to update cart_id (non-fatal):', cartUpdateError)
      }
    }
    
    // Extract vendor_id from the cart's products
    if (cart_id) {
      try {
        // Get products from cart items and find their vendor
        const vendorQuery = `
          SELECT DISTINCT s.id as vendor_id, s.name as vendor_name
          FROM cart_line_item cli
          JOIN seller_seller_product_product ssp ON ssp.product_id = cli.product_id
          JOIN seller s ON s.id = ssp.seller_id
          WHERE cli.cart_id = ?
          LIMIT 1
        `
        const vendorResults = await manager.raw(vendorQuery, [cart_id])
        const vendorRows = vendorResults?.rows || vendorResults || []
        
        if (vendorRows.length > 0) {
          const vendorId = vendorRows[0].vendor_id
          const vendorName = vendorRows[0].vendor_name
          
          // Update transaction with vendor_id
          await manager.raw(
            'UPDATE giyapay_transaction SET vendor_id = ?, updated_at = NOW() WHERE reference_number = ?',
            [vendorId, reference_number]
          )
          console.log('[GiyaPay Update Transaction] Vendor ID updated:', vendorId, '(' + vendorName + ')')
        } else {
          console.log('[GiyaPay Update Transaction] No vendor found for cart:', cart_id)
        }
      } catch (vendorError) {
        console.error('[GiyaPay Update Transaction] Failed to extract vendor_id:', vendorError)
        // Non-fatal - transaction can still proceed without vendor_id
      }
    } else if (order_id) {
      try {
        // If we don't have cart_id but have order_id, try to get cart_id from order_cart table
        const orderCartQuery = `
          SELECT cart_id FROM order_cart WHERE order_id = ? LIMIT 1
        `
        const orderCartResults = await manager.raw(orderCartQuery, [order_id])
        const orderCartRows = orderCartResults?.rows || orderCartResults || []
        
        if (orderCartRows.length > 0) {
          const resolvedCartId = orderCartRows[0].cart_id
          console.log('[GiyaPay Update Transaction] Resolved cart_id from order:', resolvedCartId)
          
          // Now get vendor from cart items
          const vendorQuery = `
            SELECT DISTINCT s.id as vendor_id, s.name as vendor_name
            FROM cart_line_item cli
            JOIN seller_seller_product_product ssp ON ssp.product_id = cli.product_id
            JOIN seller s ON s.id = ssp.seller_id
            WHERE cli.cart_id = ?
            LIMIT 1
          `
          const vendorResults = await manager.raw(vendorQuery, [resolvedCartId])
          const vendorRows = vendorResults?.rows || vendorResults || []
          
          if (vendorRows.length > 0) {
            const vendorId = vendorRows[0].vendor_id
            const vendorName = vendorRows[0].vendor_name
            
            // Update transaction with vendor_id
            await manager.raw(
              'UPDATE giyapay_transaction SET vendor_id = ?, updated_at = NOW() WHERE reference_number = ?',
              [vendorId, reference_number]
            )
            console.log('[GiyaPay Update Transaction] Vendor ID updated:', vendorId, '(' + vendorName + ')')
          } else {
            console.log('[GiyaPay Update Transaction] No vendor found for cart:', resolvedCartId)
          }
        } else {
          console.log('[GiyaPay Update Transaction] No cart_id found for order:', order_id)
        }
      } catch (vendorError) {
        console.error('[GiyaPay Update Transaction] Failed to extract vendor_id from order:', vendorError)
        // Non-fatal - transaction can still proceed without vendor_id
      }
    } else {
      console.log('[GiyaPay Update Transaction] No cart_id or order_id provided - cannot determine vendor')
    }
    
    console.log('[GiyaPay Update Transaction] Transaction updated:', reference_number, order_id)

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
    })
    
  } catch (error) {
    console.error('[GiyaPay Update Transaction] Unexpected error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}
