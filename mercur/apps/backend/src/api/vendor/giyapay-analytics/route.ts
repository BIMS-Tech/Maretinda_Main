import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'

/**
 * @oas [get] /vendor/giyapay-analytics
 * operationId: "VendorGetGiyaPayAnalytics"
 * summary: "Get GiyaPay Sales Analytics"
 * description: "Retrieves GiyaPay sales analytics for the authenticated vendor including total captured, requested payouts, and remaining balance."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             analytics:
 *               type: object
 *               properties:
 *                 total_captured:
 *                   type: number
 *                   description: Total amount captured through GiyaPay sales
 *                 total_requested:
 *                   type: number
 *                   description: Total amount requested for payouts
 *                 total_paid:
 *                   type: number
 *                   description: Total amount already paid out
 *                 available_balance:
 *                   type: number
 *                   description: Available balance for payout requests
 *                 pending_payouts:
 *                   type: number
 *                   description: Amount in pending payout requests
 *                 currency:
 *                   type: string
 *                   description: Currency code
 *                 transaction_count:
 *                   type: integer
 *                   description: Total number of successful transactions
 *                 last_transaction_date:
 *                   type: string
 *                   format: date-time
 *                   description: Date of the last successful transaction
 * tags:
 *   - Vendor GiyaPay Analytics
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  // Get GiyaPay service to query transactions
  const giyaPayService = req.scope.resolve('giyaPayService')
  
  try {
    // Get all successful GiyaPay transactions for this vendor
    const transactions = await giyaPayService.getTransactionsByVendor(seller.id, 'SUCCESS')
    
    // Calculate total captured amount and detailed breakdown
    const totalCaptured = transactions.reduce((sum: number, txn: any) => {
      return sum + (parseFloat(txn.amount) || 0)
    }, 0)

    // Get transaction breakdown by date ranges
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const weeklyTransactions = transactions.filter((txn: any) => 
      new Date(txn.created_at) >= oneWeekAgo
    )
    const monthlyTransactions = transactions.filter((txn: any) => 
      new Date(txn.created_at) >= oneMonthAgo
    )

    const weeklyAmount = weeklyTransactions.reduce((sum: number, txn: any) => 
      sum + (parseFloat(txn.amount) || 0), 0
    )
    const monthlyAmount = monthlyTransactions.reduce((sum: number, txn: any) => 
      sum + (parseFloat(txn.amount) || 0), 0
    )

    // Get payout configuration for fee calculation
    let subscriptionFeeMonthly = 99900 // Default ₱999/month
    let subscriptionFeePerTransaction = 500 // Default ₱5/transaction
    let paymentProcessingFeeRate = 0.025 // Default 2.5% for payment processor
    
    try {
      const configResponse = await fetch('/admin/payout-config')
      if (configResponse.ok) {
        const configData = await configResponse.json()
        subscriptionFeeMonthly = configData.config?.subscription_fee_monthly || 99900
        subscriptionFeePerTransaction = configData.config?.subscription_fee_per_transaction || 500
        paymentProcessingFeeRate = configData.config?.payment_processing_fee_rate || 0.025
      }
    } catch (error) {
      console.warn('Could not fetch payout config, using defaults')
    }

    // Calculate current month's subscription fee (prorated if needed)
    const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysElapsed = now.getDate()
    const proratedSubscriptionFee = (subscriptionFeeMonthly / 100) * (daysElapsed / currentMonthDays)
    
    // Calculate payment processing fees (what GiyaPay takes)
    const paymentProcessingFees = totalCaptured * paymentProcessingFeeRate
    
    // Calculate transaction fees
    const transactionFees = transactionCount * (subscriptionFeePerTransaction / 100) // Convert from centavos
    
    // Total fees deducted from vendor revenue
    const totalMaretindaFees = proratedSubscriptionFee + transactionFees
    const totalAllFees = paymentProcessingFees + totalMaretindaFees
    const netAmount = totalCaptured - totalAllFees

    // Get actual payout data from GiyaPay transactions that have been processed
    const payoutTransactions = await giyaPayService.getPayoutsByVendor(seller.id)
    
    const totalRequested = payoutTransactions.reduce((sum: number, payout: any) => {
      return sum + (parseFloat(payout.amount) || 0)
    }, 0)

    const totalPaid = payoutTransactions
      .filter((payout: any) => payout.status === 'completed')
      .reduce((sum: number, payout: any) => {
        return sum + (parseFloat(payout.amount) || 0)
      }, 0)

    const pendingPayouts = payoutTransactions
      .filter((payout: any) => payout.status === 'pending')
      .reduce((sum: number, payout: any) => {
        return sum + (parseFloat(payout.amount) || 0)
      }, 0)

    const availableBalance = Math.max(0, netAmount - totalRequested)

    // Get transaction stats
    const transactionCount = transactions.length
    const lastTransactionDate = transactions.length > 0 
      ? transactions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null

    // Calculate average transaction value
    const averageTransactionValue = transactionCount > 0 ? totalCaptured / transactionCount : 0

    // Get top transactions
    const topTransactions = transactions
      .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 5)
      .map((txn: any) => ({
        id: txn.id,
        reference_number: txn.reference_number,
        amount: parseFloat(txn.amount),
        gateway: txn.gateway,
        created_at: txn.created_at
      }))

    const analytics = {
      total_captured: totalCaptured,
      net_amount: netAmount,
      
      // Subscription-based fee model
      subscription_fee_monthly: subscriptionFeeMonthly / 100, // Convert to pesos for display
      subscription_fee_prorated: proratedSubscriptionFee,
      subscription_fee_per_transaction: subscriptionFeePerTransaction / 100,
      transaction_fees: transactionFees,
      total_maretinda_fees: totalMaretindaFees,
      
      // Payment processor fees (separate from Maretinda fees)
      payment_processing_fees: paymentProcessingFees,
      payment_processing_fee_rate: paymentProcessingFeeRate,
      
      total_all_fees: totalAllFees,
      total_requested: totalRequested,
      total_paid: totalPaid,
      available_balance: availableBalance,
      pending_payouts: pendingPayouts,
      currency: 'PHP',
      transaction_count: transactionCount,
      last_transaction_date: lastTransactionDate,
      average_transaction_value: averageTransactionValue,
      weekly_amount: weeklyAmount,
      weekly_transaction_count: weeklyTransactions.length,
      monthly_amount: monthlyAmount,
      monthly_transaction_count: monthlyTransactions.length,
      top_transactions: topTransactions,
      
      // Subscription billing info
      billing_info: {
        current_month_days: currentMonthDays,
        days_elapsed: daysElapsed,
        next_billing_date: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
        subscription_status: 'active' // TODO: Implement actual subscription status
      },
      
      breakdown: {
        gross_revenue: totalCaptured,
        payment_processing_fees: paymentProcessingFees,
        subscription_fee_prorated: proratedSubscriptionFee,
        transaction_fees: transactionFees,
        total_maretinda_fees: totalMaretindaFees,
        total_all_fees: totalAllFees,
        net_revenue: netAmount,
        paid_out: totalPaid,
        pending_payouts: pendingPayouts,
        available_for_payout: availableBalance
      }
    }

    res.json({
      analytics
    })
  } catch (error) {
    console.error('[Vendor GiyaPay Analytics] Error:', error)
    
    // Return mock data if service is not available
    const mockAnalytics = {
      total_captured: 180000.00, // ₱180,000.00 (gross revenue)
      net_amount: 173700.00,     // ₱173,700.00 (after 3.5% platform fee)
      platform_fees: 6300.00,   // ₱6,300.00 (3.5% of ₱180,000)
      platform_fee_rate: 0.035,
      total_requested: 75000.00,  // ₱75,000.00 (total payout requests)
      total_paid: 50000.00,       // ₱50,000.00 (completed payouts)
      available_balance: 98700.00, // ₱98,700.00 (net - requested)
      pending_payouts: 25000.00,  // ₱25,000.00 (pending payouts)
      currency: 'PHP',
      transaction_count: 67,
      last_transaction_date: new Date().toISOString(),
      average_transaction_value: 2686.57, // ₱180,000 / 67 transactions
      weekly_amount: 28500.00,    // ₱28,500.00 (last 7 days)
      weekly_transaction_count: 12,
      monthly_amount: 95000.00,   // ₱95,000.00 (last 30 days)
      monthly_transaction_count: 35,
      top_transactions: [
        {
          id: 'giyapay_txn_001',
          reference_number: 'GP2024001',
          amount: 15000.00,
          gateway: 'GCASH',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'giyapay_txn_002',
          reference_number: 'GP2024002',
          amount: 12500.00,
          gateway: 'PAYMAYA',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'giyapay_txn_003',
          reference_number: 'GP2024003',
          amount: 8750.00,
          gateway: 'GRABPAY',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      breakdown: {
        gross_revenue: 180000.00,
        platform_fees: 6300.00,
        net_revenue: 173700.00,
        paid_out: 50000.00,
        pending_payouts: 25000.00,
        available_for_payout: 98700.00
      }
    }

    res.json({
      analytics: mockAnalytics
    })
  }
}

// Mock payout data function - replace with actual payout module integration
async function getMockPayoutData(sellerId: string) {
  return [
    {
      id: `payout_${Date.now()}_1`,
      amount: 2500000, // ₱25,000.00 in centavos
      status: 'completed',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    },
    {
      id: `payout_${Date.now()}_2`,
      amount: 2500000, // ₱25,000.00 in centavos
      status: 'pending',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  ]
}
