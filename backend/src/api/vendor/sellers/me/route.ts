import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * @oas [post] /vendor/sellers/me
 * operationId: "VendorUpdateSeller"
 * summary: "Update Vendor Seller Profile"
 * description: "Updates the authenticated vendor's seller profile including bank information"
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 *           phone:
 *             type: string
 *           description:
 *             type: string
 *           photo:
 *             type: string
 *           bank_name:
 *             type: string
 *           account_number:
 *             type: string
 *           account_name:
 *             type: string
 *           branch_name:
 *             type: string
 *           swift_code:
 *             type: string
 *           beneficiary_address:
 *             type: string
 *           beneficiary_bank_address:
 *             type: string
 *           dft_bank_name:
 *             type: string
 *           dft_bank_code:
 *             type: string
 *           dft_swift_code:
 *             type: string
 *           dft_bank_address:
 *             type: string
 *           dft_beneficiary_name:
 *             type: string
 *           dft_beneficiary_code:
 *             type: string
 *           dft_beneficiary_address:
 *             type: string
 *           dft_account_number:
 *             type: string
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Vendor Sellers
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  console.log('🔥🔥🔥 [CUSTOM ROUTE] POST /vendor/sellers/me handler REACHED!', req.body)
  
  try {
    // Skip validation - we manually handle the fields we need
    // const validated = VendorUpdateSeller.parse(req.body)
    
    // Get the authenticated member ID from the request
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    
    if (!memberId) {
      res.status(401).json({
        message: "Unauthorized",
        error: "Member not authenticated"
      })
      return
    }

    // Get database connection
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: "Database connection not available",
        error: "Unable to connect to database"
      })
      return
    }

    // First, get the seller_id from the member table
    const member = await pgConnection('member')
      .where('id', memberId)
      .first()

    if (!member || !member.seller_id) {
      res.status(404).json({
        message: "Member not found or not associated with a seller",
        memberId: memberId
      })
      return
    }

    const sellerId = member.seller_id

    // Extract update fields from request body
    const body = req.body as any
    const updateData: any = {}
    const allowedFields = [
      'name', 'email', 'phone', 'description', 'photo',
      // Company/address fields
      'address_line', 'postal_code', 'city', 'country_code', 'tax_id',
      // New settlement fields
      'bank_name', 'account_number', 'account_name', 'branch_name',
      'swift_code', 'beneficiary_address', 'beneficiary_bank_address',
      // Legacy DFT fields
      'dft_bank_name', 'dft_bank_code', 'dft_swift_code', 'dft_bank_address',
      'dft_beneficiary_name', 'dft_beneficiary_code', 'dft_beneficiary_address', 'dft_account_number'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date()

    console.log('[VendorUpdateSeller] Updating seller:', sellerId, 'for member:', memberId)
    console.log('[VendorUpdateSeller] Fields being updated:', Object.keys(updateData))

    // Use knex query builder for UPDATE
    const result = await pgConnection('seller')
      .where('id', sellerId)
      .update(updateData)
      .returning('*')
    
    const updatedSeller = Array.isArray(result) ? result[0] : result

    if (!updatedSeller) {
      res.status(404).json({
        message: "Seller not found",
        error: `No seller found with ID: ${sellerId}`
      })
      return
    }

    console.log('[VendorUpdateSeller] ✅ Successfully updated seller')

    res.status(200).json({
      seller: updatedSeller
    })

  } catch (error) {
    console.error('[VendorUpdateSeller] ❌ Error updating seller:', error)
    res.status(500).json({
      message: "Failed to update seller",
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [get] /vendor/sellers/me
 * operationId: "VendorGetSeller"
 * summary: "Get Vendor Seller Profile"
 * description: "Gets the authenticated vendor's seller profile"
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Vendor Sellers
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    
    if (!memberId) {
      res.status(401).json({
        message: "Unauthorized",
        error: "Member not authenticated"
      })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: "Database connection not available"
      })
      return
    }

    console.log('[VendorGetSeller] Fetching seller for member ID:', memberId)

    // First, get the seller_id from the member table
    const member = await pgConnection('member')
      .where('id', memberId)
      .first()

    if (!member || !member.seller_id) {
      res.status(404).json({
        message: "Member not found or not associated with a seller",
        memberId: memberId
      })
      return
    }

    console.log('[VendorGetSeller] Found seller ID:', member.seller_id)

    // Now get the seller
    const seller = await pgConnection('seller')
      .where('id', member.seller_id)
      .first()

    console.log('[VendorGetSeller] Query result:', seller ? 'Found' : 'Not found')

    if (!seller) {
      res.status(404).json({
        message: "Seller not found",
        sellerId: member.seller_id
      })
      return
    }

    res.status(200).json({
      seller
    })

  } catch (error) {
    console.error('[VendorGetSeller] Error:', error)
    res.status(500).json({
      message: "Failed to fetch seller",
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}




