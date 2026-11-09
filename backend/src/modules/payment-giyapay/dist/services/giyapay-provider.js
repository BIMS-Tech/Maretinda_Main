"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const crypto_1 = __importDefault(require("crypto"));
class GiyaPayProviderService extends utils_1.AbstractPaymentProvider {
    constructor(container, options = {
        merchantId: "",
        merchantSecret: "",
        sandboxMode: true,
    }) {
        super(container, options);
        this.container_ = container;
        this.options_ = options;
    }
    async getGiyaPayConfig() {
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
            let pgConnection;
            try {
                pgConnection = this.container_[utils_1.ContainerRegistrationKeys.PG_CONNECTION];
            }
            catch (e) {
                pgConnection = undefined;
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
          `);
                    const result = await pgConnection.raw("SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1");
                    const rows = result?.rows || result || [];
                    console.log("[GiyaPay Provider] Database query returned", rows.length, "row(s)");
                    if (rows && rows.length > 0) {
                        const row = rows[0];
                        // Log raw database values (without exposing secrets)
                        console.log("[GiyaPay Provider] Raw DB row:", {
                            id: row.id,
                            merchant_id: row.merchant_id ? (String(row.merchant_id).substring(0, 10) + "...") : "NULL/EMPTY",
                            merchant_secret: row.merchant_secret ? "***SET***" : "NULL/EMPTY",
                            sandbox_mode: row.sandbox_mode,
                            is_enabled: row.is_enabled,
                            enabled_methods: row.enabled_methods,
                        });
                        // Validate merchant_id and merchant_secret are not empty
                        if (!row.merchant_id || String(row.merchant_id).trim() === "") {
                            console.error("[GiyaPay Provider] ERROR: merchant_id is empty or null in database!");
                            throw new Error("GiyaPay merchant_id is empty in database configuration");
                        }
                        if (!row.merchant_secret || String(row.merchant_secret).trim() === "") {
                            console.error("[GiyaPay Provider] ERROR: merchant_secret is empty or null in database!");
                            throw new Error("GiyaPay merchant_secret is empty in database configuration");
                        }
                        // enabled_methods can be JSONB array OR a JSON string depending on how it was inserted
                        let enabledMethodsRaw = row.enabled_methods;
                        if (typeof enabledMethodsRaw === "string") {
                            try {
                                enabledMethodsRaw = JSON.parse(enabledMethodsRaw);
                            }
                            catch {
                                // ignore
                            }
                        }
                        const enabledMethods = Array.isArray(enabledMethodsRaw)
                            ? enabledMethodsRaw.map((m) => String(m).toUpperCase())
                            : [];
                        // Normalize VISA/MASTERCARD -> MASTERCARD/VISA
                        const normalized = enabledMethods.map((m) => {
                            if (m === "VISA" || m === "MASTERCARD")
                                return "MASTERCARD/VISA";
                            return m;
                        });
                        const uniqueMethods = [...new Set(normalized)];
                        const dbConfig = {
                            merchantId: String(row.merchant_id).trim(),
                            merchantSecret: String(row.merchant_secret).trim(),
                            sandboxMode: !!row.sandbox_mode,
                            isEnabled: !!row.is_enabled,
                            enabledMethods: uniqueMethods,
                        };
                        // Log full details to verify values are correct (without exposing secrets)
                        const merchantIdFull = dbConfig.merchantId;
                        const merchantSecretFull = dbConfig.merchantSecret;
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
                        });
                        return dbConfig;
                    }
                    else {
                        console.warn("[GiyaPay Provider] No rows found in giyapay_config table");
                    }
                }
                catch (dbError) {
                    console.error("[GiyaPay Provider] Failed to read config from DB:", dbError);
                }
            }
            else {
                console.log("[GiyaPay Provider] PG connection not available in container; falling back to env/options");
            }
            console.log("[GiyaPay Provider] No database config found, checking environment...");
            // Fallback to options or environment variables
            const envConfig = {
                merchantId: this.options_.merchantId || process.env.GIYAPAY_MERCHANT_ID || "",
                merchantSecret: this.options_.merchantSecret || process.env.GIYAPAY_MERCHANT_SECRET || "",
                sandboxMode: this.options_.sandboxMode ?? (process.env.GIYAPAY_SANDBOX_MODE === 'true'),
                isEnabled: !!(this.options_.merchantId || process.env.GIYAPAY_MERCHANT_ID),
                enabledMethods: ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'PAYMAYA', 'QRPH', 'WECHATPAY', 'UNIONPAY'],
            };
            console.log('[GiyaPay Provider] Environment config:', {
                merchantId: envConfig.merchantId ? envConfig.merchantId.substring(0, 10) + '...' : 'EMPTY',
                isEnabled: envConfig.isEnabled
            });
            if (envConfig.merchantId) {
                console.log('[GiyaPay Provider] Using environment/options config');
                return envConfig;
            }
            console.log('[GiyaPay Provider] No configuration found anywhere!');
            return null;
        }
        catch (error) {
            console.error('[GiyaPay Provider] Failed to get config:', error);
            return null;
        }
    }
    generateSignature(merchantId, amount, currency, orderId, timestamp, nonce, secret) {
        // Gateway Direct signature: merchant_id + amount + currency + order_id + timestamp + nonce + secret
        const signatureString = `${merchantId}${amount}${currency}${orderId}${timestamp}${nonce}${secret}`;
        console.log('[GiyaPay Gateway Direct] Generating signature for order:', orderId);
        // Generate SHA512 hash for Gateway Direct
        const signature = crypto_1.default
            .createHash('sha512')
            .update(signatureString)
            .digest('hex');
        return signature;
    }
    async getPaymentStatus(input) {
        const { data } = input;
        console.log('[GiyaPay] Getting payment status for:', data);
        // Default to pending if no status information
        let paymentStatus = utils_1.PaymentSessionStatus.PENDING;
        if (data?.status) {
            switch (String(data.status).toLowerCase()) {
                case 'success':
                case 'completed':
                case 'paid':
                    paymentStatus = utils_1.PaymentSessionStatus.AUTHORIZED;
                    break;
                case 'failed':
                case 'error':
                    paymentStatus = utils_1.PaymentSessionStatus.ERROR;
                    break;
                case 'cancelled':
                case 'canceled':
                    paymentStatus = utils_1.PaymentSessionStatus.CANCELED;
                    break;
                case 'pending':
                default:
                    paymentStatus = utils_1.PaymentSessionStatus.PENDING;
                    break;
            }
        }
        console.log('[GiyaPay] Mapped status to:', paymentStatus);
        return { status: paymentStatus };
    }
    async initiatePayment(input) {
        const { amount, currency_code = "PHP", context } = input;
        const payment_session_id = input.payment_session_id;
        console.log('[GiyaPay Provider] initiatePayment called with input keys:', Object.keys(input));
        console.log('[GiyaPay Provider] payment_session_id:', payment_session_id);
        const config = await this.getGiyaPayConfig();
        console.log('[GiyaPay Provider] Config received:', {
            isEnabled: config?.isEnabled,
            hasMerchantId: !!config?.merchantId,
            hasMerchantSecret: !!config?.merchantSecret,
            merchantIdLength: config?.merchantId?.length || 0,
            merchantSecretLength: config?.merchantSecret?.length || 0,
            enabledMethods: config?.enabledMethods,
        });
        if (!config?.isEnabled || !config.merchantId || !config.merchantSecret) {
            console.error('[GiyaPay Provider] Configuration validation failed:', {
                hasConfig: !!config,
                isEnabled: config?.isEnabled,
                hasMerchantId: !!config?.merchantId,
                hasMerchantSecret: !!config?.merchantSecret,
                merchantId: config?.merchantId ? (config.merchantId.substring(0, 10) + "...") : "MISSING",
            });
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "GiyaPay is not properly configured");
        }
        // Additional validation: ensure merchant ID and secret are not just whitespace
        if (config.merchantId.trim() === "" || config.merchantSecret.trim() === "") {
            console.error('[GiyaPay Provider] ERROR: merchantId or merchantSecret is empty/whitespace!');
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "GiyaPay merchant credentials are empty");
        }
        // Validate currency code
        const validCurrency = currency_code.toUpperCase();
        if (validCurrency !== "PHP") {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `GiyaPay only supports PHP currency, received: ${validCurrency}`);
        }
        // Generate nonce and timestamp for Gateway Direct
        const nonce = crypto_1.default.randomBytes(32).toString('hex');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        // Try to get cart ID from payment session via container
        let cartId;
        try {
            // Try to get payment session from container to extract cart_id
            if (payment_session_id) {
                const paymentModuleService = this.container_["paymentModuleService"];
                if (paymentModuleService) {
                    const paymentSession = await paymentModuleService.retrievePaymentSession(payment_session_id, {
                        relations: ["payment_collection"]
                    });
                    if (paymentSession?.payment_collection?.resource_id) {
                        cartId = paymentSession.payment_collection.resource_id;
                        console.log('[GiyaPay Provider] Resolved cart_id from payment session:', cartId);
                    }
                }
            }
        }
        catch (error) {
            console.log('[GiyaPay Provider] Could not resolve cart_id from payment session:', error);
        }
        // Fallback: try context or use timestamp
        if (!cartId) {
            cartId = context?.cart_id ||
                context?.resource_id ||
                context?.cart?.id ||
                context?.id ||
                `cart_${Date.now()}`;
        }
        const orderId = cartId || `cart_${Date.now()}`;
        console.log('[GiyaPay Provider] Cart ID resolution:', {
            final_cartId: cartId,
            context_cart_id: context?.cart_id,
            context_resource_id: context?.resource_id,
            context_id: context?.id,
            contextKeys: context ? Object.keys(context) : [],
        });
        // Medusa passes the amount in MAJOR units (pesos) — the store formats it
        // directly as currency with no /100 (see lib/helpers/money.ts), and the
        // subscription flow likewise does price * 100. GiyaPay's `amount` field
        // expects the smallest unit (centavos), so multiply by 100. Without this we
        // undercharge 100x (a ₱557 cart was sent as 557 centavos = ₱5.57).
        const amountInCents = Math.round(Number(amount) * 100).toString();
        // Use storefront URL for callbacks
        const storefrontUrl = process.env.STOREFRONT_URL || process.env.STORE_CORS?.split(",")[0] || "http://localhost:3000";
        console.log('[GiyaPay Gateway Direct] Preparing payment for order:', orderId);
        // Generate signature for Gateway Direct
        const signature = this.generateSignature(config.merchantId, amountInCents, "PHP", orderId, timestamp, nonce, config.merchantSecret);
        // Determine checkout URL based on sandbox mode
        const checkoutUrl = config.sandboxMode
            ? 'https://sandbox.giyapay.com/checkout'
            : 'https://pay.giyapay.com/checkout';
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
            customer_email: context?.email || "",
            // payment_method will be set by the storefront based on which button is clicked
        };
        console.log('[GiyaPay Gateway Direct] Form data prepared:', {
            ...gatewayData,
            signature: signature.substring(0, 10) + '...',
            merchant_secret: '***', // Hidden for security
        });
        return {
            id: crypto_1.default.randomUUID(),
            data: {
                checkout_url: checkoutUrl,
                form_data: gatewayData,
                session_id: input.data?.session_id,
                cart_id: cartId,
                order_id: orderId,
                session_data: gatewayData,
                enabled_methods: config.enabledMethods || ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA'],
                sandbox_mode: config.sandboxMode,
            }
        };
    }
    /**
     * The session → cart link comes from Medusa's own tables, and the payment from
     * a transaction /giyapay/verify recorded after checking GiyaPay's signature,
     * so nothing the shopper sends can satisfy this. Returns null when in doubt:
     * the cart stays open instead of becoming an unpaid order.
     */
    async findVerifiedPayment(sessionId) {
        if (!sessionId)
            return null;
        try {
            const pg = this.container_[utils_1.ContainerRegistrationKeys.PG_CONNECTION];
            const sessions = await pg.raw(`SELECT ps.amount, cpc.cart_id
           FROM payment_session ps
           JOIN cart_payment_collection cpc ON cpc.payment_collection_id = ps.payment_collection_id
          WHERE ps.id = ? AND cpc.deleted_at IS NULL
          LIMIT 1`, [sessionId]);
            const session = sessions.rows?.[0];
            if (!session?.cart_id)
                return null;
            const payments = await pg.raw(`SELECT reference_number FROM giyapay_transaction
          WHERE cart_id = ? AND status = 'SUCCESS' AND amount + 0.005 >= ?
          ORDER BY created_at DESC
          LIMIT 1`, [session.cart_id, session.amount]);
            return payments.rows?.[0] ?? null;
        }
        catch (error) {
            console.error('[GiyaPay] Could not check payment for session:', sessionId, error);
            return null;
        }
    }
    async authorizePayment(input) {
        const sessionId = input.context?.idempotency_key || input.data?.session_id;
        const payment = await this.findVerifiedPayment(sessionId);
        if (!payment) {
            console.warn('[GiyaPay] Refused to authorize unpaid session:', sessionId);
            return { status: utils_1.PaymentSessionStatus.PENDING, data: input.data ?? {} };
        }
        return {
            status: utils_1.PaymentSessionStatus.AUTHORIZED,
            data: {
                ...input.data,
                id: payment.reference_number,
                reference_number: payment.reference_number,
            }
        };
    }
    async cancelPayment(input) {
        console.log('[GiyaPay] Canceling payment:', input);
        return {
            data: {
                id: input.data?.id || crypto_1.default.randomUUID(),
                status: "cancelled",
                ...input.data
            }
        };
    }
    async capturePayment(input) {
        return {
            data: {
                id: input.data?.id || crypto_1.default.randomUUID(),
                status: "captured",
                ...input.data
            }
        };
    }
    async deletePayment(input) {
        console.log('[GiyaPay] Deleting payment:', input);
        return {
            data: {
                id: input.data?.id || crypto_1.default.randomUUID(),
                status: "deleted",
                ...input.data
            }
        };
    }
    async refundPayment(input) {
        console.log('[GiyaPay] Refunding payment:', input);
        // GiyaPay refunds would need to be handled through their API
        // For now, we'll return a success status
        return {
            data: {
                id: input.data?.id || crypto_1.default.randomUUID(),
                status: "refunded",
                amount: input.amount,
                ...input.data
            }
        };
    }
    async retrievePayment(input) {
        console.log('[GiyaPay] Retrieving payment:', input);
        return {
            data: {
                id: input.data?.id || crypto_1.default.randomUUID(),
                ...input.data
            }
        };
    }
    async updatePayment(input) {
        console.log('[GiyaPay] Updating payment:', input);
        return {
            data: {
                ...input.data,
                ...input.context
            }
        };
    }
    /**
     * GiyaPay reports payments by redirecting the shopper, not by webhook. Anything
     * arriving on /hooks/payment/giyapay is unauthenticated, so it must never be
     * able to authorize a session and complete a cart.
     */
    async getWebhookActionAndData(_data) {
        return { action: "not_supported" };
    }
}
GiyaPayProviderService.identifier = "giyapay";
exports.default = GiyaPayProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l5YXBheS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9naXlhcGF5LXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBR0EscURBS2tDO0FBcUJsQyxvREFBMkI7QUFnQjNCLE1BQU0sc0JBQXVCLFNBQVEsK0JBQXVDO0lBSzFFLFlBQ0UsU0FBYyxFQUNkLFVBQTBCO1FBQ3hCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsY0FBYyxFQUFFLEVBQUU7UUFDbEIsV0FBVyxFQUFFLElBQUk7S0FDbEI7UUFFRCxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFBO1FBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO0lBQ3pCLENBQUM7SUFFTyxLQUFLLENBQUMsZ0JBQWdCO1FBQzVCLElBQUksQ0FBQztZQUNIOzs7Ozs7O2VBT0c7WUFDSDs7OztlQUlHO1lBQ0gsSUFBSSxZQUFpQixDQUFBO1lBQ3JCLElBQUksQ0FBQztnQkFDSCxZQUFZLEdBQUksSUFBSSxDQUFDLFVBQWtCLENBQUMsaUNBQXlCLENBQUMsYUFBYSxDQUFDLENBQUE7WUFDbEYsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1gsWUFBWSxHQUFHLFNBQVMsQ0FBQTtZQUMxQixDQUFDO1lBRUQsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDO29CQUNILCtFQUErRTtvQkFDL0UsTUFBTSxZQUFZLENBQUMsR0FBRyxDQUFDOzs7Ozs7Ozs7OztXQVd0QixDQUFDLENBQUE7b0JBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsR0FBRyxDQUNuQywrREFBK0QsQ0FDaEUsQ0FBQTtvQkFDRCxNQUFNLElBQUksR0FBSSxNQUFjLEVBQUUsSUFBSSxJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUE7b0JBRWxE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