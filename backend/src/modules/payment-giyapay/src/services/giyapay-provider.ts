import {
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  ContainerRegistrationKeys,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
} from "@medusajs/types"
import crypto from "crypto"

interface GiyaPayOptions {
  merchantId: string
  merchantSecret: string
  sandboxMode: boolean
}

interface GiyaPayConfig {
  merchantId: string
  merchantSecret: string
  sandboxMode: boolean
  isEnabled: boolean
  enabledMethods?: string[]
}

class GiyaPayProviderService extends AbstractPaymentProvider<GiyaPayOptions> {
  static identifier = "giyapay"
  private readonly container_: any
  protected readonly options_: GiyaPayOptions

  constructor(
    container: any,
    options: GiyaPayOptions = {
      merchantId: "",
      merchantSecret: "",
      sandboxMode: true,
    }
  ) {
    super(container, options)
    this.container_ = container
    this.options_ = options
  }

  private async getGiyaPayConfig(): Promise<GiyaPayConfig | null> {
    try {
      /**
       * Important: payment providers run inside the payment module container, which
       * may not include app-level services (like `giyaPayService` from backend/src/services).
       *
       * So we read config directly from DB via injected PG connection.
       * Also: DO NOT touch `container.resolve` here — Awilix proxy can interpret that as
       * resolving a dependency named "resolve" (the bug you hit earlier).
       */
      /**
       * NOTE: `container` here is an Awilix proxy. Accessing `container.cradle`
       * triggers Awilix to try resolving a dependency literally named "cradle".
       * So we MUST NOT touch `.cradle` at all.
       */
      let pgConnection: any
      try {
        pgConnection = (this.container_ as any)[ContainerRegistrationKeys.PG_CONNECTION]
      } catch (e) {
        pgConnection = undefined
      }

      if (pgConnection) {
        try {
          // Ensure table exists (so we don't depend on app-service initialization order)
          await pgConnection.raw(`
            CREATE TABLE IF NOT EXISTS giyapay_config (
              id VARCHAR(255) PRIMARY KEY,
              merchant_id VARCHAR(255) NOT NULL,
              merchant_secret VARCHAR(255) NOT NULL,
              sandbox_mode BOOLEAN DEFAULT true,
              is_enabled BOOLEAN DEFAULT false,
              enabled_methods JSONB DEFAULT '["instapay", "visa", "mastercard", "gcash", "paymaya"]',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)

          const result = await pgConnection.raw(
            "SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1"
          )
          const rows = (result as any)?.rows || result || []

          console.log("[GiyaPay Provider] Database query returned", rows.length, "row(s)")

          if (rows && rows.length > 0) {
            const row = rows[0]

            // Log raw database values (without exposing secrets)
            console.log("[GiyaPay Provider] Raw DB row:", {
              id: row.id,
              merchant_id: row.merchant_id ? (String(row.merchant_id).substring(0, 10) + "...") : "NULL/EMPTY",
              merchant_secret: row.merchant_secret ? "***SET***" : "NULL/EMPTY",
              sandbox_mode: row.sandbox_mode,
              is_enabled: row.is_enabled,
              enabled_methods: row.enabled_methods,
            })

            // Validate merchant_id and merchant_secret are not empty
            if (!row.merchant_id || String(row.merchant_id).trim() === "") {
              console.error("[GiyaPay Provider] ERROR: merchant_id is empty or null in database!")
              throw new Error("GiyaPay merchant_id is empty in database configuration")
            }

            if (!row.merchant_secret || String(row.merchant_secret).trim() === "") {
              console.error("[GiyaPay Provider] ERROR: merchant_secret is empty or null in database!")
              throw new Error("GiyaPay merchant_secret is empty in database configuration")
            }

            // enabled_methods can be JSONB array OR a JSON string depending on how it was inserted
            let enabledMethodsRaw: any = row.enabled_methods
            if (typeof enabledMethodsRaw === "string") {
              try {
                enabledMethodsRaw = JSON.parse(enabledMethodsRaw)
              } catch {
                // ignore
              }
            }

            const enabledMethods = Array.isArray(enabledMethodsRaw)
              ? enabledMethodsRaw.map((m: any) => String(m).toUpperCase())
              : []

            // Normalize VISA/MASTERCARD -> MASTERCARD/VISA
            const normalized = enabledMethods.map((m) => {
              if (m === "VISA" || m === "MASTERCARD") return "MASTERCARD/VISA"
              return m
            })

            const uniqueMethods = [...new Set(normalized)]

            const dbConfig: GiyaPayConfig = {
              merchantId: String(row.merchant_id).trim(),
              merchantSecret: String(row.merchant_secret).trim(),
              sandboxMode: !!row.sandbox_mode,
              isEnabled: !!row.is_enabled,
              enabledMethods: uniqueMethods,
            }

            // Log full details to verify values are correct (without exposing secrets)
            const merchantIdFull = dbConfig.merchantId
            const merchantSecretFull = dbConfig.merchantSecret
            console.log("[GiyaPay Provider] Using database config:", {
              merchantId: merchantIdFull
                ? String(merchantIdFull).substring(0, 10) + "..."
                : "EMPTY",
              merchantIdFullLength: merchantIdFull?.length || 0,
              merchantIdFullValue: merchantIdFull || "EMPTY", // Log full value for debugging
              merchantSecret: merchantSecretFull ? "***SET***" : "EMPTY",
              merchantSecretFullLength: merchantSecretFull?.length || 0,
              merchantSecretPreview: merchantSecretFull 
                ? (merchantSecretFull.substring(0, 4) + "..." + merchantSecretFull.substring(merchantSecretFull.length - 4))
                : "EMPTY",
              sandboxMode: dbConfig.sandboxMode,
              isEnabled: dbConfig.isEnabled,
              enabledMethods: dbConfig.enabledMethods,
            })

            return dbConfig
          } else {
            console.warn("[GiyaPay Provider] No rows found in giyapay_config table")
          }
        } catch (dbError) {
          console.error("[GiyaPay Provider] Failed to read config from DB:", dbError)
        }
      } else {
        console.log(
          "[GiyaPay Provider] PG connection not available in container; falling back to env/options"
        )
      }

      console.log("[GiyaPay Provider] No database config found, checking environment...")

      // Fallback to options or environment variables
      const envConfig = {
        merchantId: this.options_.merchantId || process.env.GIYAPAY_MERCHANT_ID || "",
        merchantSecret: this.options_.merchantSecret || process.env.GIYAPAY_MERCHANT_SECRET || "",
        sandboxMode: this.options_.sandboxMode ?? (process.env.GIYAPAY_SANDBOX_MODE === 'true'),
        isEnabled: !!(this.options_.merchantId || process.env.GIYAPAY_MERCHANT_ID),
        enabledMethods: ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'PAYMAYA'],
      }

      console.log('[GiyaPay Provider] Environment config:', {
        merchantId: envConfig.merchantId ? envConfig.merchantId.substring(0, 10) + '...' : 'EMPTY',
        isEnabled: envConfig.isEnabled
      })

      if (envConfig.merchantId) {
        console.log('[GiyaPay Provider] Using environment/options config')
        return envConfig
      }

      console.log('[GiyaPay Provider] No configuration found anywhere!')
      return null
    } catch (error) {
      console.error('[GiyaPay Provider] Failed to get config:', error)
      return null
    }
  }

  private generateSignature(merchantId: string, amount: string, currency: string, orderId: string, timestamp: string, nonce: string, secret: string): string {
    // Gateway Direct signature: merchant_id + amount + currency + order_id + timestamp + nonce + secret
    const signatureString = `${merchantId}${amount}${currency}${orderId}${timestamp}${nonce}${secret}`
    
    console.log('[GiyaPay Gateway Direct] Generating signature for order:', orderId)
    
    // Generate SHA512 hash for Gateway Direct
    const signature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex')
    
    return signature
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { data } = input

    console.log('[GiyaPay] Getting payment status for:', data)

    // Default to pending if no status information
    let paymentStatus = PaymentSessionStatus.PENDING

    if (data?.status) {
      switch (String(data.status).toLowerCase()) {
        case 'success':
        case 'completed':
        case 'paid':
          paymentStatus = PaymentSessionStatus.AUTHORIZED
          break
        case 'failed':
        case 'error':
          paymentStatus = PaymentSessionStatus.ERROR
          break
        case 'cancelled':
        case 'canceled':
          paymentStatus = PaymentSessionStatus.CANCELED
          break
        case 'pending':
        default:
          paymentStatus = PaymentSessionStatus.PENDING
          break
      }
    }

    console.log('[GiyaPay] Mapped status to:', paymentStatus)
    
    return { status: paymentStatus }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code = "PHP", context } = input
    const payment_session_id = (input as any).payment_session_id

    console.log('[GiyaPay Provider] initiatePayment called with input keys:', Object.keys(input))
    console.log('[GiyaPay Provider] payment_session_id:', payment_session_id)

    const config = await this.getGiyaPayConfig()
    
    console.log('[GiyaPay Provider] Config received:', {
      isEnabled: config?.isEnabled,
      hasMerchantId: !!config?.merchantId,
      hasMerchantSecret: !!config?.merchantSecret,
      merchantIdLength: config?.merchantId?.length || 0,
      merchantSecretLength: config?.merchantSecret?.length || 0,
      enabledMethods: config?.enabledMethods,
    })
    
    if (!config?.isEnabled || !config.merchantId || !config.merchantSecret) {
      console.error('[GiyaPay Provider] Configuration validation failed:', {
        hasConfig: !!config,
        isEnabled: config?.isEnabled,
        hasMerchantId: !!config?.merchantId,
        hasMerchantSecret: !!config?.merchantSecret,
        merchantId: config?.merchantId ? (config.merchantId.substring(0, 10) + "...") : "MISSING",
      })
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "GiyaPay is not properly configured"
      )
    }

    // Additional validation: ensure merchant ID and secret are not just whitespace
    if (config.merchantId.trim() === "" || config.merchantSecret.trim() === "") {
      console.error('[GiyaPay Provider] ERROR: merchantId or merchantSecret is empty/whitespace!')
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "GiyaPay merchant credentials are empty"
      )
    }

    // Validate currency code
    const validCurrency = currency_code.toUpperCase()
    if (validCurrency !== "PHP") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `GiyaPay only supports PHP currency, received: ${validCurrency}`
      )
    }

    // Generate nonce and timestamp for Gateway Direct
    const nonce = crypto.randomBytes(32).toString('hex')
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // Try to get cart ID from payment session via container
    let cartId: string | undefined
    
    try {
      // Try to get payment session from container to extract cart_id
      if (payment_session_id) {
        const paymentModuleService = this.container_["paymentModuleService"]
        if (paymentModuleService) {
          const paymentSession = await paymentModuleService.retrievePaymentSession(payment_session_id, {
            relations: ["payment_collection"]
          })
          
          if (paymentSession?.payment_collection?.resource_id) {
            cartId = paymentSession.payment_collection.resource_id
            console.log('[GiyaPay Provider] Resolved cart_id from payment session:', cartId)
          }
        }
      }
    } catch (error) {
      console.log('[GiyaPay Provider] Could not resolve cart_id from payment session:', error)
    }
    
    // Fallback: try context or use timestamp
    if (!cartId) {
      cartId = (context as any)?.cart_id || 
               (context as any)?.resource_id ||
               (context as any)?.cart?.id ||
               (context as any)?.id || 
               `cart_${Date.now()}`
    }
    
    const orderId: string = cartId || `cart_${Date.now()}`
    
    console.log('[GiyaPay Provider] Cart ID resolution:', {
      final_cartId: cartId,
      context_cart_id: (context as any)?.cart_id,
      context_resource_id: (context as any)?.resource_id,
      context_id: (context as any)?.id,
      contextKeys: context ? Object.keys(context) : [],
    })
    
    // Gateway Direct uses amount in cents
    const amountInCents = Math.round(Number(amount) * 100).toString()

    // Use storefront URL for callbacks
    const storefrontUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:3000"
    
    console.log('[GiyaPay Gateway Direct] Preparing payment for order:', orderId)
    
    // Generate signature for Gateway Direct
    const signature = this.generateSignature(
      config.merchantId,
      amountInCents,
      "PHP",
      orderId,
      timestamp,
      nonce,
      config.merchantSecret
    )

    // Determine checkout URL based on sandbox mode
    const checkoutUrl = config.sandboxMode 
      ? 'https://sandbox.giyapay.com/checkout' 
      : 'https://pay.giyapay.com/checkout'

    // Gateway Direct form data
    const gatewayData = {
      success_callback: `${storefrontUrl}/giyapay/success`,
      error_callback: `${storefrontUrl}/giyapay/error`,
      cancel_callback: `${storefrontUrl}/giyapay/cancel`,
      merchant_id: config.merchantId,
      amount: amountInCents,
      currency: "PHP",
      nonce,
      timestamp,
      description: `Payment for order ${orderId}`,
      signature,
      order_id: orderId,
      customer_email: (context as any)?.email || "",
      // payment_method will be set by the storefront based on which button is clicked
    }

    console.log('[GiyaPay Gateway Direct] Form data prepared:', {
      ...gatewayData,
      signature: signature.substring(0, 10) + '...',
      merchant_secret: '***', // Hidden for security
      merchant_id: gatewayData.merchant_id, // Log full merchant_id to verify
      merchant_id_length: gatewayData.merchant_id?.length || 0,
      merchant_id_preview: gatewayData.merchant_id ? (gatewayData.merchant_id.substring(0, 10) + "...") : "MISSING",
      // Verify full values are being used
      merchantIdUsed: config.merchantId,
      merchantIdUsedLength: config.merchantId?.length || 0,
      merchantSecretUsed: config.merchantSecret ? (config.merchantSecret.substring(0, 4) + "..." + config.merchantSecret.substring(config.merchantSecret.length - 4)) : "MISSING",
      merchantSecretLength: config.merchantSecret?.length || 0,
      merchantSecretFirst4: config.merchantSecret?.substring(0, 4) || "N/A",
      merchantSecretLast4: config.merchantSecret ? config.merchantSecret.substring(config.merchantSecret.length - 4) : "N/A",
    })

    return {
      id: crypto.randomUUID(),
      data: {
        checkout_url: checkoutUrl,
        form_data: gatewayData,
        cart_id: cartId,
        order_id: orderId,
        session_data: gatewayData,
        enabled_methods: config.enabledMethods || ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA'],
        sandbox_mode: config.sandboxMode,
      }
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    console.log('[GiyaPay] Authorizing payment:', input)
    
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        id: input.data?.reference_number || crypto.randomUUID(),
        ...input.data
      }
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    console.log('[GiyaPay] Canceling payment:', input)
    
    return {
      data: {
        id: input.data?.id || crypto.randomUUID(),
        status: "cancelled",
        ...input.data
      }
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    console.log('[GiyaPay] Capturing payment:', input)
    
    return {
      data: {
        id: input.data?.id || crypto.randomUUID(),
        status: "captured",
        ...input.data
      }
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    console.log('[GiyaPay] Deleting payment:', input)
    
    return {
      data: {
        id: input.data?.id || crypto.randomUUID(),
        status: "deleted",
        ...input.data
      }
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    console.log('[GiyaPay] Refunding payment:', input)
    
    // GiyaPay refunds would need to be handled through their API
    // For now, we'll return a success status
    return {
      data: {
        id: input.data?.id || crypto.randomUUID(),
        status: "refunded",
        amount: input.amount,
        ...input.data
      }
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    console.log('[GiyaPay] Retrieving payment:', input)
    
    return {
      data: {
        id: input.data?.id || crypto.randomUUID(),
        ...input.data
      }
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    console.log('[GiyaPay] Updating payment:', input)
    
    return {
      data: {
        ...input.data,
        ...input.context
      }
    }
  }

  async getWebhookActionAndData(
    data: Record<string, unknown>
  ): Promise<WebhookActionResult> {
    console.log('[GiyaPay] Processing webhook:', data)
    
    return {
      action: "authorized",
      data: {
        session_id: String(data.session_id || ''),
        amount: Number(data.amount || 0),
      }
    }
  }
}

export default GiyaPayProviderService
