import { MedusaService } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

class GiyaPayService extends MedusaService({}) {
  private container: any

  constructor(container: any) {
    super(...arguments)
    this.container = container
  }

  private async getManager(sharedContext?: any) {
    if (sharedContext?.transactionManager) {
      return sharedContext.transactionManager
    }
    // Fallback to PG connection from container
    try {
      return this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (error) {
      console.error('[GiyaPayService] Failed to resolve PG_CONNECTION:', error)
      throw error
    }
  }

  private async initializeTables(sharedContext?: any) {
    try {
      const manager = await this.getManager(sharedContext)
      
      // Create giyapay_config table if it doesn't exist
      await manager.raw(`
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

      // Create giyapay_transaction table if it doesn't exist
      await manager.raw(`
        CREATE TABLE IF NOT EXISTS giyapay_transaction (
          id VARCHAR(255) PRIMARY KEY,
          reference_number VARCHAR(255) NOT NULL,
          order_id VARCHAR(255),
          cart_id VARCHAR(255),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'PHP',
          status VARCHAR(50) DEFAULT 'PENDING',
          gateway VARCHAR(50) DEFAULT 'GCASH',
          description TEXT,
          payment_data JSONB,
          vendor_id VARCHAR(255),
          vendor_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Add vendor columns if they don't exist (for existing tables)
      await manager.raw(`ALTER TABLE giyapay_transaction ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255)`)
      await manager.raw(`ALTER TABLE giyapay_transaction ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`)
      await manager.raw(`ALTER TABLE giyapay_transaction ADD COLUMN IF NOT EXISTS cart_id VARCHAR(255)`)
      
      // Add enabled_methods column if it doesn't exist (for existing giyapay_config tables)
      await manager.raw(`ALTER TABLE giyapay_config ADD COLUMN IF NOT EXISTS enabled_methods JSONB DEFAULT '["instapay", "visa", "mastercard", "gcash", "paymaya"]'`)

      console.log('[GiyaPayService] Tables initialized successfully')
    } catch (error) {
      console.error('[GiyaPayService] Failed to initialize tables:', error)
    }
  }
  
  async getConfig(sharedContext?: any): Promise<any | null> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      // Get config from database
      const result = await manager.raw('SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1')
      const rows = result?.rows || result || []
      
      if (rows && rows.length > 0) {
        const config = rows[0]
        console.log('[GiyaPayService] Using database config')
        
        // Convert enabled_methods from database format to GiyaPay Gateway Direct format
        const dbMethods = config.enabled_methods || ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'PAYMAYA']
        const enabledMethods = Array.isArray(dbMethods) ? dbMethods.map((method: string) => {
          const upperMethod = method.toUpperCase()
          // Convert 'VISA' or 'MASTERCARD' to 'MASTERCARD/VISA'
          if (upperMethod === 'VISA' || upperMethod === 'MASTERCARD') {
            return 'MASTERCARD/VISA'
          }
          return upperMethod
        }) : ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'PAYMAYA']
        
        // Remove duplicates
        const uniqueMethods = [...new Set(enabledMethods)]
        
        return {
          id: config.id,
          merchantId: config.merchant_id,
          merchantSecret: config.merchant_secret,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled,
          enabledMethods: uniqueMethods,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        }
      }
      
      // Fall back to environment variables
      const envConfig = {
        merchantId: process.env.GIYAPAY_MERCHANT_ID || "",
        merchantSecret: process.env.GIYAPAY_MERCHANT_SECRET || "",
        sandboxMode: process.env.GIYAPAY_SANDBOX_MODE === 'true',
        isEnabled: !!(process.env.GIYAPAY_MERCHANT_ID && process.env.GIYAPAY_MERCHANT_SECRET),
        enabledMethods: ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'PAYMAYA'],
      }
      
      if (envConfig.merchantId) {
        console.log('[GiyaPayService] Using environment config')
        return envConfig
      }
      
      return null
    } catch (error) {
      console.error('[GiyaPayService] Failed to get config:', error)
      return null
    }
  }

  async createOrUpdateConfig(data: {
    merchantId: string
    merchantSecret: string
    sandboxMode?: boolean
    isEnabled?: boolean
    enabledMethods?: string[]
  }, sharedContext?: any): Promise<any> {
    
    try {
      // Validate and trim merchant credentials
      const merchantId = String(data.merchantId || "").trim()
      const merchantSecret = String(data.merchantSecret || "").trim()
      
      if (!merchantId || merchantId === "") {
        throw new Error("GiyaPay merchantId cannot be empty")
      }
      
      if (!merchantSecret || merchantSecret === "") {
        throw new Error("GiyaPay merchantSecret cannot be empty")
      }
      
      console.log('[GiyaPayService] Saving config to database:', {
        merchantId: merchantId.substring(0, 10) + "...",
        merchantSecret: merchantSecret ? "***SET***" : "EMPTY",
        merchantIdLength: merchantId.length,
        merchantSecretLength: merchantSecret.length,
        sandboxMode: data.sandboxMode ?? false,
        isEnabled: data.isEnabled ?? true,
      })
      
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      const configId = `giyapay_${Date.now()}`
      const now = new Date()
      
      // Delete existing configs (we only keep one)
      await manager.raw('DELETE FROM giyapay_config')
      
      // Insert new config - Use ? placeholders for Knex
      await manager.raw(`
        INSERT INTO giyapay_config (
          id, merchant_id, merchant_secret, sandbox_mode, is_enabled, enabled_methods, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        configId,
        merchantId,
        merchantSecret,
        data.sandboxMode ?? false,
        data.isEnabled ?? true,
        JSON.stringify(data.enabledMethods || ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'PAYMAYA']),
        now,
        now
      ])
      
      console.log('[GiyaPayService] Config saved to database successfully')
      
      return {
        id: configId,
        merchantId: merchantId,
        merchantSecret: merchantSecret,
        sandboxMode: data.sandboxMode ?? false,
        isEnabled: data.isEnabled ?? true,
        enabledMethods: data.enabledMethods || ['instapay', 'visa', 'mastercard', 'gcash', 'paymaya'],
        createdAt: now,
        updatedAt: now,
      }
    } catch (error) {
      console.error('[GiyaPayService] Failed to save config:', error)
      throw error
    }
  }

  // API-specific method that handles both creation and updates
  async createOrUpdateConfigForAPI(data: {
    merchantId: string
    merchantSecret: string
    sandboxMode?: boolean
    isEnabled?: boolean
    enabledMethods?: string[]
  }): Promise<any> {
    return this.createOrUpdateConfig(data)
  }

  async getTransactions(options?: { status?: string }, sharedContext?: any): Promise<any[]> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      let whereClause = ''
      const params: any[] = []
      
      if (options?.status) {
        whereClause = 'WHERE status = ?'
        params.push(options.status)
      }
      
      const result = await manager.raw(`
        SELECT * FROM giyapay_transaction 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT 100
      `, params)
      const rows = result?.rows || result || []
      
      return rows.map((row: any) => ({
        id: row.id,
        reference_number: row.reference_number,
        order_id: row.order_id,
        cart_id: row.cart_id,
        vendor_id: row.vendor_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        status: row.status,
        gateway: row.gateway,
        description: row.description,
        payment_data: row.payment_data,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
    } catch (error) {
      console.error('[GiyaPayService] Failed to get transactions:', error)
      return []
    }
  }

  async createTransaction(data: {
    referenceNumber: string
    orderId?: string
    cartId?: string
    vendorId?: string
    amount: number
    currency?: string
    status?: string
    gateway?: string
    description?: string
    paymentData?: any
  }, sharedContext?: any): Promise<any> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      const transactionId = `giyapay_txn_${Date.now()}`
      const now = new Date()
      
      await manager.raw(`
        INSERT INTO giyapay_transaction (
          id, reference_number, order_id, cart_id, vendor_id, amount, currency, status, gateway, description, payment_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transactionId,
        data.referenceNumber,
        data.orderId || null,
        data.cartId || null,
        data.vendorId || null,
        data.amount,
        data.currency || 'PHP',
        data.status || 'PENDING',
        data.gateway || 'GIYAPAY',
        data.description || null,
        data.paymentData ? JSON.stringify(data.paymentData) : null,
        now,
        now
      ])
      
      console.log('[GiyaPayService] Transaction created:', transactionId, 'for vendor:', data.vendorId || 'unknown')
      
      return {
        id: transactionId,
        referenceNumber: data.referenceNumber,
        orderId: data.orderId,
        cartId: data.cartId,
        vendorId: data.vendorId,
        amount: data.amount,
        currency: data.currency || 'PHP',
        status: data.status || 'PENDING',
        gateway: data.gateway || 'GIYAPAY',
        description: data.description,
        paymentData: data.paymentData,
        createdAt: now,
        updatedAt: now,
      }
    } catch (error) {
      console.error('[GiyaPayService] Failed to create transaction:', error)
      throw error
    }
  }


  async updateTransactionStatus(referenceNumber: string, status: string, orderId?: string, sharedContext?: any): Promise<boolean> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      const now = new Date()
      
      let updateQuery = 'UPDATE giyapay_transaction SET status = ?, updated_at = ?'
      const params: any[] = [status, now]
      
      if (orderId) {
        updateQuery += ', order_id = ?'
        params.push(orderId)
      }
      
      updateQuery += ' WHERE reference_number = ?'
      params.push(referenceNumber)
      
      await manager.raw(updateQuery, params)
      
      console.log('[GiyaPayService] Transaction status updated:', referenceNumber, status)
      return true
    } catch (error) {
      console.error('[GiyaPayService] Failed to update transaction status:', error)
      return false
    }
  }
}

export default GiyaPayService
