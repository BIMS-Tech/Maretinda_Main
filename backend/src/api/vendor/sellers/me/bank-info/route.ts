import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * WORKAROUND: Separate endpoint for bank information updates
 * This bypasses the Mercur plugin's strict validation
 */

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  console.log('🔥 [BANK-INFO] Custom bank info endpoint reached!')
  
  try {
    // Get the authenticated member ID
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    
    if (!memberId) {
      res.status(401).json({
        message: "Unauthorized"
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
        message: "Database connection not available"
      })
      return
    }

    // Get seller_id from member
    const member = await pgConnection('member')
      .where('id', memberId)
      .first()

    if (!member || !member.seller_id) {
      res.status(404).json({
        message: "Seller not found"
      })
      return
    }

    const sellerId = member.seller_id

    // Extract bank fields from request body
    const body = req.body as any
    const bankFields: any = {}
    
    const allowedBankFields = [
      'bank_name', 'account_number', 'account_name', 'branch_name',
      'swift_code', 'beneficiary_address', 'beneficiary_bank_address',
      'dft_bank_name', 'dft_bank_code', 'dft_swift_code', 'dft_bank_address',
      'dft_beneficiary_name', 'dft_beneficiary_code', 'dft_beneficiary_address',
      'dft_account_number'
    ]

    for (const field of allowedBankFields) {
      if (body[field] !== undefined) {
        bankFields[field] = body[field]
      }
    }

    // Add updated_at
    bankFields.updated_at = new Date()

    console.log('[BANK-INFO] Updating seller:', sellerId, 'with fields:', Object.keys(bankFields))

    // Update seller
    const result = await pgConnection('seller')
      .where('id', sellerId)
      .update(bankFields)
      .returning('*')
    
    const updatedSeller = Array.isArray(result) ? result[0] : result

    if (!updatedSeller) {
      res.status(404).json({
        message: "Seller not found"
      })
      return
    }

    console.log('[BANK-INFO] ✅ Successfully updated bank information')

    res.status(200).json({
      seller: updatedSeller,
      message: "Bank information updated successfully"
    })

  } catch (error) {
    console.error('[BANK-INFO] ❌ Error:', error)
    res.status(500).json({
      message: "Failed to update bank information",
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    
    if (!memberId) {
      res.status(401).json({
        message: "Unauthorized"
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

    const member = await pgConnection('member')
      .where('id', memberId)
      .first()

    if (!member || !member.seller_id) {
      res.status(404).json({
        message: "Seller not found"
      })
      return
    }

    const seller = await pgConnection('seller')
      .where('id', member.seller_id)
      .first()

    if (!seller) {
      res.status(404).json({
        message: "Seller not found"
      })
      return
    }

    // Extract only bank fields
    const bankInfo = {
      bank_name: seller.bank_name,
      account_number: seller.account_number,
      account_name: seller.account_name,
      branch_name: seller.branch_name,
      swift_code: seller.swift_code,
      beneficiary_address: seller.beneficiary_address,
      beneficiary_bank_address: seller.beneficiary_bank_address,
      dft_bank_name: seller.dft_bank_name,
      dft_bank_code: seller.dft_bank_code,
      dft_swift_code: seller.dft_swift_code,
      dft_bank_address: seller.dft_bank_address,
      dft_beneficiary_name: seller.dft_beneficiary_name,
      dft_beneficiary_code: seller.dft_beneficiary_code,
      dft_beneficiary_address: seller.dft_beneficiary_address,
      dft_account_number: seller.dft_account_number,
    }

    res.status(200).json({
      bank_info: bankInfo
    })

  } catch (error) {
    console.error('[BANK-INFO] Error:', error)
    res.status(500).json({
      message: "Failed to fetch bank information",
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

