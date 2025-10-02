import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface PayoutConfig {
  id: string
  subscription_fee_monthly: number // Fixed monthly subscription fee in centavos
  subscription_fee_per_transaction?: number // Optional per-transaction fee in centavos
  payment_processing_fee_rate?: number // Optional payment processor fee (e.g., GiyaPay's cut)
  minimum_payout_amount: number // Minimum payout in centavos
  maximum_payout_amount: number // Maximum payout in centavos
  settlement_schedule: 'daily' | 'weekly' | 'monthly'
  banking_days_only: boolean
  auto_settlement: boolean
  subscription_billing_day: number // Day of month to bill subscription (1-28)
  grace_period_days: number // Days before suspending for non-payment
  updated_at: string
  updated_by: string
}

// Mock configuration - in production this would be stored in database
const DEFAULT_CONFIG: PayoutConfig = {
  id: 'payout_config_default',
  subscription_fee_monthly: 99900, // ₱999.00 per month subscription
  subscription_fee_per_transaction: 500, // ₱5.00 per transaction (optional)
  payment_processing_fee_rate: 0.025, // 2.5% for payment processor (GiyaPay)
  minimum_payout_amount: 100000, // ₱1,000.00
  maximum_payout_amount: 100000000, // ₱1,000,000.00
  settlement_schedule: 'daily',
  banking_days_only: true,
  auto_settlement: false,
  subscription_billing_day: 1, // Bill on 1st of each month
  grace_period_days: 7, // 7 days grace period
  updated_at: new Date().toISOString(),
  updated_by: 'system'
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // In production, fetch from database
    // const config = await payoutConfigService.getActiveConfig()
    
    res.json({
      config: DEFAULT_CONFIG
    })

  } catch (error) {
    console.error('[Payout Config API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch payout configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const PUT = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const body = req.body as any
    const {
      subscription_fee_monthly,
      subscription_fee_per_transaction,
      payment_processing_fee_rate,
      minimum_payout_amount,
      maximum_payout_amount,
      settlement_schedule,
      banking_days_only,
      auto_settlement,
      subscription_billing_day,
      grace_period_days
    } = body

    // Validate input
    if (subscription_fee_monthly !== undefined && subscription_fee_monthly < 0) {
      return res.status(400).json({
        error: 'Monthly subscription fee cannot be negative'
      })
    }

    if (subscription_fee_per_transaction !== undefined && subscription_fee_per_transaction < 0) {
      return res.status(400).json({
        error: 'Per-transaction fee cannot be negative'
      })
    }

    if (payment_processing_fee_rate !== undefined && (payment_processing_fee_rate < 0 || payment_processing_fee_rate > 1)) {
      return res.status(400).json({
        error: 'Payment processing fee rate must be between 0 and 1'
      })
    }

    if (subscription_billing_day !== undefined && (subscription_billing_day < 1 || subscription_billing_day > 28)) {
      return res.status(400).json({
        error: 'Billing day must be between 1 and 28'
      })
    }

    // In production, update database
    // const updatedConfig = await payoutConfigService.updateConfig({
    //   platform_fee_rate,
    //   subscription_fee_monthly,
    //   subscription_fee_per_transaction,
    //   minimum_payout_amount,
    //   maximum_payout_amount,
    //   settlement_schedule,
    //   banking_days_only,
    //   auto_settlement,
    //   updated_by: req.user?.id || 'admin'
    // })

    const updatedConfig: PayoutConfig = {
      ...DEFAULT_CONFIG,
      ...(subscription_fee_monthly !== undefined && { subscription_fee_monthly }),
      ...(subscription_fee_per_transaction !== undefined && { subscription_fee_per_transaction }),
      ...(payment_processing_fee_rate !== undefined && { payment_processing_fee_rate }),
      ...(minimum_payout_amount !== undefined && { minimum_payout_amount }),
      ...(maximum_payout_amount !== undefined && { maximum_payout_amount }),
      ...(settlement_schedule !== undefined && { settlement_schedule }),
      ...(banking_days_only !== undefined && { banking_days_only }),
      ...(auto_settlement !== undefined && { auto_settlement }),
      ...(subscription_billing_day !== undefined && { subscription_billing_day }),
      ...(grace_period_days !== undefined && { grace_period_days }),
      updated_at: new Date().toISOString(),
      updated_by: 'admin'
    }

    res.json({
      config: updatedConfig,
      message: 'Payout configuration updated successfully'
    })

  } catch (error) {
    console.error('[Payout Config API] Error updating:', error)
    res.status(500).json({
      error: 'Failed to update payout configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}



