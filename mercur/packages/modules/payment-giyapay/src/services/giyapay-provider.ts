import {
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
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
}

class GiyaPayProviderService extends AbstractPaymentProvider<GiyaPayOptions> {
  static identifier = "giyapay"
  private readonly container_: any

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
  }

  async getGiyaPayConfig(): Promise<GiyaPayConfig | null> {
    console.log('[GiyaPay Provider] 🔍 Starting getGiyaPayConfig method')
    try {
      // Try to get from the GiyaPay service (database) first
      let giyaPayService
      
      try {
        giyaPayService = this.container_.resolve("giyaPayService")
      } catch (serviceError) {
        console.log('[GiyaPay Provider] Service not registered, attempting on-demand creation...')
        console.log('[GiyaPay Provider] Service error:', serviceError.message)
        try {
          // Try different possible paths
          const path = require("path")
          let GiyaPayService
          const possiblePaths = [
            path.join(process.cwd(), "../../apps/backend/src/services/giyapay"),
            path.join(process.cwd(), "apps/backend/src/services/giyapay"),
            path.join(process.cwd(), "src/services/giyapay"),
          ]
          
          for (const servicePath of possiblePaths) {
            try {
              console.log('[GiyaPay Provider] Trying path:', servicePath)
              GiyaPayService = require(servicePath).default
              console.log('[GiyaPay Provider] Successfully loaded from:', servicePath)
              break
            } catch (pathError) {
              console.log('[GiyaPay Provider] Failed to load from:', servicePath, pathError.message)
            }
          }
          
                              if (GiyaPayService) {
                        giyaPayService = new GiyaPayService(this.container_)
                        console.log('[GiyaPay Provider] Service instance created successfully')
                        // Skip container registration due to context differences
          } else {
            console.log('[GiyaPay Provider] Failed to load service from any path, falling back to environment config')
            throw new Error('Could not load GiyaPayService')
          }
        } catch (loadError) {
          console.log('[GiyaPay Provider] On-demand service creation failed:', loadError.message)
          throw serviceError // Re-throw original error to trigger fallback
        }
      }
      
      const dbConfig = await giyaPayService.getConfigForAPI()
      
      console.log('[GiyaPay Provider] 🔍 Got dbConfig from service:', {
        hasConfig: !!dbConfig,
        merchantId: dbConfig?.merchantId || 'NONE',
        isEnabled: dbConfig?.isEnabled || false,
        fullConfig: dbConfig
      })
      
      if (dbConfig && dbConfig.isEnabled) {
        console.log('[GiyaPay Provider] ✅ Using DATABASE config:', {
          merchantId: dbConfig.merchantId,
          sandboxMode: dbConfig.sandboxMode,
          isEnabled: dbConfig.isEnabled,
          apiUrl: dbConfig.sandboxMode ? 'https://sandbox.giyapay.com/api/payment' : 'https://pay.giyapay.com/api/payment'
        })
        return {
          merchantId: dbConfig.merchantId,
          merchantSecret: dbConfig.merchantSecret,
          sandboxMode: dbConfig.sandboxMode,
          isEnabled: dbConfig.isEnabled,
        }
      }
      
      console.log('[GiyaPay Provider] ❌ Config check failed:', {
        hasConfig: !!dbConfig,
        isEnabled: dbConfig?.isEnabled,
        reason: !dbConfig ? 'No config returned' : !dbConfig.isEnabled ? 'Config disabled' : 'Unknown'
      })
    } catch (error) {
      console.log('[GiyaPay Provider] ❌ Exception caught:', error.message)
      console.log('[GiyaPay Provider] Database config not available, falling back to environment variables')
    }
    
    // Fallback to environment variables
    const envConfig = {
      merchantId: process.env.GIYAPAY_MERCHANT_ID || "merchant1234",
      merchantSecret: process.env.GIYAPAY_MERCHANT_SECRET || "098f6bcd4621d373cade4e832627b4f6",
      sandboxMode: process.env.GIYAPAY_SANDBOX_MODE === "true",
      isEnabled: !!(process.env.GIYAPAY_MERCHANT_ID && process.env.GIYAPAY_MERCHANT_SECRET),
    }
    
    console.log('[GiyaPay Provider] ⚠️ Using ENVIRONMENT config (fallback):', {
      merchantId: envConfig.merchantId,
      sandboxMode: envConfig.sandboxMode,
      isEnabled: envConfig.isEnabled,
      apiUrl: envConfig.sandboxMode ? 'https://sandbox.giyapay.com/api/payment' : 'https://pay.giyapay.com/api/payment'
    })
    
    return envConfig
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const status = input.data?.status as string
    
    let paymentStatus: PaymentSessionStatus
    switch (status) {
      case "SUCCESS":
        paymentStatus = PaymentSessionStatus.AUTHORIZED
        break
      case "PENDING":
        paymentStatus = PaymentSessionStatus.PENDING
        break
      case "FAILED":
        paymentStatus = PaymentSessionStatus.ERROR
        break
      case "CANCELLED":
        paymentStatus = PaymentSessionStatus.CANCELED
        break
      default:
        paymentStatus = PaymentSessionStatus.PENDING
    }
    
    return { status: paymentStatus }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code = "PHP", context } = input

    const config = await this.getGiyaPayConfig()
    
    if (!config?.isEnabled || !config.merchantId || !config.merchantSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "GiyaPay is not properly configured"
      )
    }

    // Validate currency code - GiyaPay expects specific format
    const validCurrency = currency_code.toUpperCase()
    if (validCurrency !== "PHP") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `GiyaPay only supports PHP currency, received: ${validCurrency}`
      )
    }

    // Generate nonce and timestamp
    const nonce = crypto.randomUUID()
    const timestamp = Math.floor(Date.now() / 1000)

    // Use the cart ID as the order ID so we can complete it later
    const cartId = (context as any)?.cart_id || (context as any)?.id || `cart_${Date.now()}`
    const orderId = cartId
    const signatureData = {
      amount: Math.round(Number(amount) * 100), // Convert to cents (GiyaPay expects amount in cents)
      currency: "PHP", // GiyaPay expects exactly "PHP"
      merchant_id: config.merchantId,
      order_id: orderId,
      nonce,
      timestamp,
      description: `Payment for order`,
    }

    const signature = this.generateSignature(signatureData, config.merchantSecret)

    // Use backend URLs for proper payment processing
    const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"
    
    console.log('[GiyaPay] Environment check:', {
      BACKEND_URL: process.env.BACKEND_URL,
      backendUrl,
      orderId
    })
    
    // Determine API URL based on sandbox mode
    const apiUrl = config.sandboxMode 
      ? 'https://sandbox.giyapay.com/api/payment' 
      : 'https://pay.giyapay.com/api/payment'
    
    console.log('[GiyaPay] 🔧 Payment Configuration:', {
      merchantId: config.merchantId,
      sandboxMode: config.sandboxMode,
      apiUrl: apiUrl,
      amount: Math.round(Number(amount) * 100),
      currency: "PHP"
    })

    // Include a default method but allow storefront to override via form field
    const sessionData = {
      ...signatureData,
      signature,
      success_callback: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?order_id=${orderId}&cart_id=${cartId}`,
      error_callback: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?order_id=${orderId}`,
      cancel_callback: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel?order_id=${orderId}`,
      order_id: orderId,
      status: "PENDING",
      api_url: apiUrl // Include API URL in session data for frontend use
    }

    console.log('[GiyaPay] Callback URLs generated:', {
      success_callback: sessionData.success_callback,
      error_callback: sessionData.error_callback,
      cancel_callback: sessionData.cancel_callback
    })

    return {
      id: `giyapay_${Date.now()}`,
      data: sessionData,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    console.log("[GiyaPay] Authorizing payment:", input)
    
    // Save transaction to database
    try {
      let giyaPayService
      
      try {
        giyaPayService = this.container_.resolve("giyaPayService")
      } catch (serviceError) {
        console.log('[GiyaPay Provider] Transaction service not registered, attempting on-demand creation...')
        try {
          // Try different possible paths
          const path = require("path")
          let GiyaPayService
          const possiblePaths = [
            path.join(process.cwd(), "../../apps/backend/src/services/giyapay"),
            path.join(process.cwd(), "apps/backend/src/services/giyapay"),
            path.join(process.cwd(), "src/services/giyapay"),
          ]
          
          for (const servicePath of possiblePaths) {
            try {
              GiyaPayService = require(servicePath).default
              console.log('[GiyaPay Provider] Transaction service loaded from:', servicePath)
              break
            } catch (pathError) {
              // Continue trying other paths
            }
          }
          
          if (GiyaPayService) {
            giyaPayService = new GiyaPayService(this.container_)
            console.log('[GiyaPay Provider] Transaction service instance created successfully')
            // Skip container registration due to context differences
          } else {
            throw new Error('Could not load GiyaPayService for transactions')
          }
        } catch (loadError) {
          console.log('[GiyaPay Provider] Transaction service creation failed:', loadError.message)
          // Don't fail the payment for transaction save issues
        }
      }
      const data = input.data as any
      
      // Extract vendor information from context or payment data
      const context = input.context as any || {}
      const vendorId = context.vendor_id || data?.vendor_id || (data?.order_id && data?.order_id.split('_')[1]) || null
      const vendorName = context.vendor_name || data?.vendor_name || undefined
      
      const transactionData = {
        referenceNumber: data?.refno || data?.order_id || `giyapay_${Date.now()}`,
        orderId: data?.order_id,
        cartId: (input.context as any)?.cart_id || data?.cart_id || (data?.success_callback?.match(/cart_id=([^&]+)/)?.[1]) || (input.context as any)?.id || undefined,
        amount: parseFloat(String(data?.amount || "0")) / 100, // Convert from cents
        currency: "PHP",
        status: "SUCCESS" as const,
        // Use provider/payment method from GiyaPay payload if available
        gateway: [data?.payment_method, data?.provider, data?.channel]
          .filter(Boolean)
          .map((v: any) => v.toString().toUpperCase())?.[0] || "GCASH",
        description: "GiyaPay payment authorization",
        vendorId,
        vendorName,
        // Add beneficiary information for DFT format
        beneficiaryName: vendorName || "Default Beneficiary",
        beneficiaryAccount: `VENDOR_${vendorId || 'DEFAULT'}`,
        beneficiaryAddress: "Philippines",
        beneficiaryBankName: "Default Bank",
        beneficiarySwiftCode: "DEFAULTPH",
        beneficiaryBankAddress: "Philippines",
        remittanceType: "DFT",
        sourceAccount: "GIYAPAY_MAIN",
        purpose: `DFT ${new Date().toISOString().split('T')[0]}`,
        paymentData: {
          ...data,
          authorized_at: new Date().toISOString(),
          vendor_id: vendorId,
          vendor_name: vendorName,
          cart_id: (input.context as any)?.cart_id || data?.cart_id || (input.context as any)?.id,
        },
      }
      
              await giyaPayService.createTransactionForAPI(transactionData)
      console.log("[GiyaPay] Transaction saved to database:", transactionData.referenceNumber)
    } catch (error) {
      console.error("[GiyaPay] Failed to save transaction:", error)
      // Don't fail the payment for database issues
    }
    
    // For GiyaPay, if we reach this point, the payment was successful
    // Return AUTHORIZED status so Medusa can place the order
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...input.data,
        authorized_at: new Date().toISOString(),
        payment_method: "giyapay",
        status: "authorized",
      },
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...input.data,
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
      },
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...input.data,
        status: "CAPTURED",
        captured_at: new Date().toISOString(),
      },
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return {
      data: input.data,
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    // GiyaPay refund logic would go here
    return {
      data: {
        ...input.data,
        refund_amount: input.amount,
        refunded_at: new Date().toISOString(),
      },
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return {
      data: input.data,
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return {
      data: input.data,
    }
  }

  async getWebhookActionAndData(
    data: { data: Record<string, unknown>; rawData: string | Buffer; headers: Record<string, unknown> }
  ): Promise<WebhookActionResult> {
    // Parse the event from raw data or headers
    const event = data.headers['x-giyapay-event'] as string || 'unknown'
    
    switch (event) {
      case "payment.success":
        return {
          action: "authorized" as const,
          data: {
            session_id: data.data.session_id as string,
            amount: data.data.amount as number,
          },
        }
      case "payment.failed":
        return {
          action: "failed" as const,
          data: {
            session_id: data.data.session_id as string,
            amount: data.data.amount as number || 0,
          },
        }
      default:
        return {
          action: "not_supported" as const,
        }
    }
  }

  private generateSignature(data: Record<string, any>, secret: string): string {
    // According to GiyaPay documentation:
    // myStringForHashing = 'merchant_id' + 'amount' + 'currency' + 'order_id' + 'timestamp' + 'nonce' + '(your merchant secret key)';
    
    // Ensure all values are strings for concatenation
    const myStringForHashing = String(data.merchant_id) + String(data.amount) + String(data.currency) + String(data.order_id) + String(data.timestamp) + String(data.nonce) + secret;
    
    // Debug: Log the values being used
    console.log('GiyaPay Signature Debug:', {
      merchant_id: data.merchant_id,
      amount: data.amount,
      currency: data.currency,
      order_id: data.order_id,
      timestamp: data.timestamp,
      nonce: data.nonce,
      secret: secret.substring(0, 10) + '...', // Only show first 10 chars for security
      concatenatedString: myStringForHashing.substring(0, 50) + '...', // Show first 50 chars
    });
    
    // Generate SHA512 hash (not HMAC)
    const signatureKey = crypto.createHash('sha512').update(myStringForHashing).digest('hex');
    
    console.log('Generated Signature:', signatureKey.substring(0, 20) + '...');
    
    return signatureKey;
  }
}

export default GiyaPayProviderService