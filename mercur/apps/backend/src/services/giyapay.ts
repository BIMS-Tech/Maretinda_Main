import { EntityManager } from "@mikro-orm/knex"
import { Context } from "@medusajs/framework/types"
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

class GiyaPayService extends MedusaService({}) {
  private container: any

  constructor(container: any) {
    super(...arguments)
    this.container = container
  }

  @InjectTransactionManager()
  private async initializeTables(@MedusaContext() sharedContext?: Context<EntityManager>) {
    try {
      const manager = sharedContext?.transactionManager!
      
      // Create giyapay_config table if it doesn't exist
      await manager.query(`
        CREATE TABLE IF NOT EXISTS giyapay_config (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          merchant_id VARCHAR(255) NOT NULL,
          merchant_secret VARCHAR(255) NOT NULL,
          sandbox_mode BOOLEAN DEFAULT true,
          is_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // Create giyapay_transactions table if it doesn't exist
      await manager.query(`
        CREATE TABLE IF NOT EXISTS giyapay_transactions (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          reference_number VARCHAR(255) UNIQUE NOT NULL,
          order_id VARCHAR(255),
          cart_id VARCHAR(255),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'PHP',
          status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
          gateway VARCHAR(50) DEFAULT 'GCASH',
          description TEXT,
          payment_data JSON,
          vendor_id VARCHAR(255),
          vendor_name VARCHAR(255),
          beneficiary_name VARCHAR(255),
          beneficiary_account VARCHAR(255),
          beneficiary_address TEXT,
          beneficiary_bank_name VARCHAR(255),
          beneficiary_swift_code VARCHAR(255),
          beneficiary_bank_address TEXT,
          remittance_type VARCHAR(50) DEFAULT 'DFT',
          source_account VARCHAR(255),
          purpose TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      console.log('[GiyaPayService] Database tables initialized')
    } catch (error) {
      console.error('[GiyaPayService] Failed to initialize tables:', error)
    }
  }
  
  @InjectTransactionManager()
  async getConfig(@MedusaContext() sharedContext?: Context<EntityManager>): Promise<any | null> {
    try {
      await this.initializeTables(sharedContext)
      const manager = sharedContext?.transactionManager!
      
      // Get config from database
      const result = await manager.query('SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1')
      
      if (result && result.length > 0) {
        const config = result[0]
        console.log('[GiyaPayService] Using database config')
        return {
          id: config.id,
          merchantId: config.merchant_id,
          merchantSecret: config.merchant_secret,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled,
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

  @InjectTransactionManager()
  async createOrUpdateConfig(data: {
    merchantId: string
    merchantSecret: string
    sandboxMode?: boolean
    isEnabled?: boolean
  }, @MedusaContext() sharedContext?: Context<EntityManager>): Promise<any> {
    try {
      await this.initializeTables(sharedContext)
      const manager = sharedContext?.transactionManager!
      
      // Check if config exists
      const existingConfig = await manager.query('SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1')
      
      const configData = {
        merchant_id: data.merchantId,
        merchant_secret: data.merchantSecret,
        sandbox_mode: data.sandboxMode,
        is_enabled: data.isEnabled ?? false,
      }
      
      let result
      
      if (existingConfig && existingConfig.length > 0) {
        // Update existing config
        const configId = existingConfig[0].id
        await manager.query(
          'UPDATE giyapay_config SET merchant_id = ?, merchant_secret = ?, sandbox_mode = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [configData.merchant_id, configData.merchant_secret, configData.sandbox_mode, configData.is_enabled, configId]
        )
        
        result = await manager.query('SELECT * FROM giyapay_config WHERE id = ?', [configId])
      } else {
        // Create new config
        const configId = require('crypto').randomUUID()
        await manager.query(
          'INSERT INTO giyapay_config (id, merchant_id, merchant_secret, sandbox_mode, is_enabled) VALUES (?, ?, ?, ?, ?)',
          [configId, configData.merchant_id, configData.merchant_secret, configData.sandbox_mode, configData.is_enabled]
        )
        
        result = await manager.query('SELECT * FROM giyapay_config WHERE id = ?', [configId])
      }
      
      if (result && result.length > 0) {
        const config = result[0]
        console.log('[GiyaPayService] Config saved to database:', {
          merchantId: config.merchant_id,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled
        })
        
        return {
          id: config.id,
          merchantId: config.merchant_id,
          merchantSecret: config.merchant_secret,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        }
      }
      
      throw new Error('Failed to save config')
    } catch (error) {
      console.error('[GiyaPayService] Failed to save config:', error)
      throw error
    }
  }

  @InjectTransactionManager()
  async createTransaction(data: {
    referenceNumber: string
    orderId?: string
    cartId?: string
    amount: number
    currency?: string
    status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED"
    gateway?: string
    description?: string
    paymentData?: Record<string, any>
    vendorId?: string
    vendorName?: string
    beneficiaryName?: string
    beneficiaryAccount?: string
    beneficiaryAddress?: string
    beneficiaryBankName?: string
    beneficiarySwiftCode?: string
    beneficiaryBankAddress?: string
    remittanceType?: string
    sourceAccount?: string
    purpose?: string
  }, @MedusaContext() sharedContext?: Context<EntityManager>): Promise<any> {
    try {
      await this.initializeTables(sharedContext)
      const manager = sharedContext?.transactionManager!
      
      const transactionId = require('crypto').randomUUID()
      
      await manager.query(
        'INSERT INTO giyapay_transactions (id, reference_number, order_id, cart_id, amount, currency, status, gateway, description, payment_data, vendor_id, vendor_name, beneficiary_name, beneficiary_account, beneficiary_address, beneficiary_bank_name, beneficiary_swift_code, beneficiary_bank_address, remittance_type, source_account, purpose) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transactionId,
          data.referenceNumber,
          data.orderId || null,
          data.cartId || null,
          data.amount,
          data.currency || 'PHP',
          data.status || 'PENDING',
          data.gateway || 'GCASH',
          data.description || null,
          data.paymentData ? JSON.stringify(data.paymentData) : null,
          data.vendorId || null,
          data.vendorName || null,
          data.beneficiaryName || null,
          data.beneficiaryAccount || null,
          data.beneficiaryAddress || null,
          data.beneficiaryBankName || null,
          data.beneficiarySwiftCode || null,
          data.beneficiaryBankAddress || null,
          data.remittanceType || 'DFT',
          data.sourceAccount || null,
          data.purpose || null
        ]
      )
      
      const result = await manager.query('SELECT * FROM giyapay_transactions WHERE id = ?', [transactionId])
      
      if (result && result.length > 0) {
        const transaction = result[0]
        console.log('[GiyaPayService] Transaction saved to database:', {
          id: transaction.id,
          referenceNumber: transaction.reference_number,
          amount: transaction.amount,
          status: transaction.status
        })
        
        return {
          id: transaction.id,
          reference_number: transaction.reference_number,
          order_id: transaction.order_id,
          cart_id: transaction.cart_id,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          status: transaction.status,
          gateway: transaction.gateway,
          description: transaction.description,
          payment_data: transaction.payment_data ? JSON.parse(transaction.payment_data) : null,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        }
      }
      
      throw new Error('Failed to save transaction')
    } catch (error) {
      console.error('[GiyaPayService] Failed to save transaction:', error)
      throw error
    }
  }

  async updateTransaction(
    id: string, 
    data: Partial<{
      status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED"
      paymentData: Record<string, any>
      description: string
    }>
  ): Promise<any> {
    console.log('[GiyaPayService] Transaction update:', id, data)
    return { id, ...data, updatedAt: new Date() }
  }

  @InjectTransactionManager()
  async getTransactions(options: {
    skip?: number
    take?: number
    order?: Record<string, "ASC" | "DESC">
  } = {}, @MedusaContext() sharedContext?: Context<EntityManager>): Promise<any[]> {
    try {
      await this.initializeTables(sharedContext)
      const manager = sharedContext?.transactionManager!
      
      const limit = options.take || 20
      const offset = options.skip || 0
      const orderBy = options.order?.createdAt === 'ASC' ? 'ASC' : 'DESC'
      
      const result = await manager.query(
        `SELECT * FROM giyapay_transactions ORDER BY created_at ${orderBy} LIMIT ? OFFSET ?`,
        [limit, offset]
      )
      
      if (result && result.length > 0) {
        return result.map((transaction: any) => ({
          id: transaction.id,
          referenceNumber: transaction.reference_number,
          orderId: transaction.order_id,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          status: transaction.status,
          gateway: transaction.gateway,
          description: transaction.description,
          paymentData: transaction.payment_data ? JSON.parse(transaction.payment_data) : null,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
        }))
      }
      
      return []
    } catch (error) {
      console.error('[GiyaPayService] Failed to get transactions:', error)
      return []
    }
  }

  async getTransactionByReference(referenceNumber: string): Promise<any | null> {
    console.log('[GiyaPayService] Getting transaction by reference:', referenceNumber)
    return null
  }

  // Wrapper methods for API calls (no context injection needed)
  async getConfigForAPI(): Promise<any | null> {
    try {
      // For payment provider context, bypass container and use direct connection
      let pgConnection
      try {
        // First try the standard container approach
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        console.log('[GiyaPayService] ✅ Standard container resolve succeeded')
      } catch (containerError) {
        console.log('[GiyaPayService] Standard container failed, trying direct access...')
        try {
          // Try accessing container properties directly
          const containerKeys = Object.keys(this.container)
          console.log('[GiyaPayService] Available container keys:', containerKeys.slice(0, 5)) // Show first 5 keys
          
          // Try different ways to get the connection
          if (this.container.__pg_connection__) {
            pgConnection = this.container.__pg_connection__
            console.log('[GiyaPayService] ✅ Direct __pg_connection__ found')
          } else if (this.container.pgConnection) {
            pgConnection = this.container.pgConnection
            console.log('[GiyaPayService] ✅ Direct pgConnection found')
          } else if (this.container._container && this.container._container.resolve) {
            try {
              pgConnection = this.container._container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
              console.log('[GiyaPayService] ✅ _container resolve succeeded')
            } catch (e) {
              console.log('[GiyaPayService] _container resolve failed:', e.message)
            }
          }
          
          if (!pgConnection) {
            console.log('[GiyaPayService] ❌ No pgConnection found, returning null for graceful fallback')
            return null
          }
        } catch (e) {
          console.log('[GiyaPayService] ❌ All connection attempts failed:', e.message)
          return null
        }
      }
      
      // First, ensure the table exists
      await pgConnection.raw(`
        CREATE TABLE IF NOT EXISTS giyapay_config (
          id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid()),
          merchant_id VARCHAR(255) NOT NULL,
          merchant_secret VARCHAR(255) NOT NULL,
          sandbox_mode BOOLEAN DEFAULT true,
          is_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Get config from database
      const result = await pgConnection.raw('SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1')
      
      console.log('[GiyaPayService] Query result:', {
        hasResult: !!result,
        hasRows: !!(result && result.rows),
        rowCount: result?.rows?.length || 0,
        firstRow: result?.rows?.[0] || null
      })
      
      if (result && result.rows && result.rows.length > 0) {
        const config = result.rows[0]
        const returnConfig = {
          id: config.id,
          merchantId: config.merchant_id,
          merchantSecret: config.merchant_secret,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        }
        console.log('[GiyaPayService] ✅ Returning database config:', {
          merchantId: returnConfig.merchantId,
          sandboxMode: returnConfig.sandboxMode,
          isEnabled: returnConfig.isEnabled
        })
        return returnConfig
      }
      
      console.log('[GiyaPayService] ❌ No rows found in giyapay_config table')
      
      // Fall back to environment variables
      const envConfig = {
        merchantId: process.env.GIYAPAY_MERCHANT_ID || "",
        merchantSecret: process.env.GIYAPAY_MERCHANT_SECRET || "",
        sandboxMode: process.env.GIYAPAY_SANDBOX_MODE === 'true',
        isEnabled: !!(process.env.GIYAPAY_MERCHANT_ID && process.env.GIYAPAY_MERCHANT_SECRET),
      }
      
      if (envConfig.merchantId) {
        console.log('[GiyaPayService] Using environment config')
        return envConfig
      }
      
      return null
    } catch (error) {
      console.error('[GiyaPayService] API getConfig failed:', error)
      return null
    }
  }

  async createOrUpdateConfigForAPI(data: {
    merchantId: string
    merchantSecret: string
    sandboxMode?: boolean
    isEnabled?: boolean
  }): Promise<any> {
    try {
      // Get the database connection directly
      const pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      
      // First, ensure the table exists
      await pgConnection.raw(`
        CREATE TABLE IF NOT EXISTS giyapay_config (
          id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid()),
          merchant_id VARCHAR(255) NOT NULL,
          merchant_secret VARCHAR(255) NOT NULL,
          sandbox_mode BOOLEAN DEFAULT true,
          is_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Check if config exists
      const existingConfig = await pgConnection.raw('SELECT * FROM giyapay_config ORDER BY created_at DESC LIMIT 1')
      
      const configData = {
        merchant_id: data.merchantId,
        merchant_secret: data.merchantSecret,
        sandbox_mode: data.sandboxMode,
        is_enabled: data.isEnabled ?? false,
      }
      
      let result
      
      if (existingConfig && existingConfig.rows && existingConfig.rows.length > 0) {
        // Update existing config
        const configId = existingConfig.rows[0].id
        await pgConnection.raw(
          'UPDATE giyapay_config SET merchant_id = ?, merchant_secret = ?, sandbox_mode = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [configData.merchant_id, configData.merchant_secret, configData.sandbox_mode, configData.is_enabled, configId]
        )
        
        result = await pgConnection.raw('SELECT * FROM giyapay_config WHERE id = ?', [configId])
      } else {
        // Create new config
        const configId = require('crypto').randomUUID()
        await pgConnection.raw(
          'INSERT INTO giyapay_config (id, merchant_id, merchant_secret, sandbox_mode, is_enabled) VALUES (?, ?, ?, ?, ?)',
          [configId, configData.merchant_id, configData.merchant_secret, configData.sandbox_mode, configData.is_enabled]
        )
        
        result = await pgConnection.raw('SELECT * FROM giyapay_config WHERE id = ?', [configId])
      }
      
      if (result && result.rows && result.rows.length > 0) {
        const config = result.rows[0]
        console.log('[GiyaPayService] Config saved to database:', {
          merchantId: config.merchant_id,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled
        })
        
        return {
          id: config.id,
          merchantId: config.merchant_id,
          merchantSecret: config.merchant_secret,
          sandboxMode: !!config.sandbox_mode,
          isEnabled: !!config.is_enabled,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        }
      }
      
      throw new Error('Failed to save config')
    } catch (error) {
      console.error('[GiyaPayService] API createOrUpdateConfig failed:', error)
      throw error
    }
  }

  async createTransactionForAPI(data: {
    referenceNumber: string
    orderId?: string
    cartId?: string
    amount: number
    currency?: string
    status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED"
    gateway?: string
    description?: string
    paymentData?: Record<string, any>
    vendorId?: string
    vendorName?: string
    beneficiaryName?: string
    beneficiaryAccount?: string
    beneficiaryAddress?: string
    beneficiaryBankName?: string
    beneficiarySwiftCode?: string
    beneficiaryBankAddress?: string
    remittanceType?: string
    sourceAccount?: string
    purpose?: string
  }): Promise<any> {
    try {
      // For payment provider context, use same connection logic as getConfigForAPI
      let pgConnection
      try {
        // First try the standard container approach
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        console.log('[GiyaPayService] ✅ Transaction: Standard container resolve succeeded')
      } catch (containerError) {
        console.log('[GiyaPayService] Transaction: Standard container failed, trying direct access...')
        try {
          // Try different ways to get the connection
          if (this.container.__pg_connection__) {
            pgConnection = this.container.__pg_connection__
            console.log('[GiyaPayService] ✅ Transaction: Direct __pg_connection__ found')
          } else if (this.container.pgConnection) {
            pgConnection = this.container.pgConnection
            console.log('[GiyaPayService] ✅ Transaction: Direct pgConnection found')
          } else if (this.container._container && this.container._container.resolve) {
            try {
              pgConnection = this.container._container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
              console.log('[GiyaPayService] ✅ Transaction: _container resolve succeeded')
            } catch (e) {
              console.log('[GiyaPayService] Transaction: _container resolve failed:', e.message)
            }
          }
          
          if (!pgConnection) {
            console.log('[GiyaPayService] ❌ Transaction: No pgConnection found, skipping database save')
            return { id: `mock_${Date.now()}`, message: "Transaction not saved - no database connection" }
          }
        } catch (e) {
          console.log('[GiyaPayService] ❌ Transaction: All connection attempts failed:', e.message)
          return { id: `mock_${Date.now()}`, message: "Transaction not saved - connection error" }
        }
      }
      
      // First, ensure the table exists
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
          beneficiary_name VARCHAR(255),
          beneficiary_account VARCHAR(255),
          beneficiary_address TEXT,
          beneficiary_bank_name VARCHAR(255),
          beneficiary_swift_code VARCHAR(255),
          beneficiary_bank_address TEXT,
          remittance_type VARCHAR(50) DEFAULT 'DFT',
          source_account VARCHAR(255),
          purpose TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Ensure new columns exist (idempotent)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS cart_id VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_account VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_address TEXT`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_bank_name VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_swift_code VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_bank_address TEXT`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS remittance_type VARCHAR(50) DEFAULT 'DFT'`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS source_account VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS purpose TEXT`)
      
      const transactionId = require('crypto').randomUUID()
      
      await pgConnection.raw(
        'INSERT INTO giyapay_transactions (id, reference_number, order_id, cart_id, amount, currency, status, gateway, description, payment_data, vendor_id, vendor_name, beneficiary_name, beneficiary_account, beneficiary_address, beneficiary_bank_name, beneficiary_swift_code, beneficiary_bank_address, remittance_type, source_account, purpose) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transactionId,
          data.referenceNumber,
          data.orderId || null,
          data.cartId || null,
          data.amount,
          data.currency || 'PHP',
          data.status || 'PENDING',
          data.gateway || 'GCASH',
          data.description || null,
          data.paymentData ? JSON.stringify(data.paymentData) : null,
          data.vendorId || null,
          data.vendorName || null,
          data.beneficiaryName || null,
          data.beneficiaryAccount || null,
          data.beneficiaryAddress || null,
          data.beneficiaryBankName || null,
          data.beneficiarySwiftCode || null,
          data.beneficiaryBankAddress || null,
          data.remittanceType || 'DFT',
          data.sourceAccount || null,
          data.purpose || null
        ]
      )
      
      console.log('[GiyaPayService] Transaction saved to database:', {
        id: transactionId,
        referenceNumber: data.referenceNumber,
        amount: data.amount,
        status: data.status || 'PENDING'
      })
      
      return {
        id: transactionId,
        reference_number: data.referenceNumber,
        order_id: data.orderId,
        cart_id: data.cartId,
        amount: data.amount,
        currency: data.currency || 'PHP',
        status: data.status || 'PENDING',
        gateway: data.gateway || 'GCASH',
        description: data.description,
        payment_data: data.paymentData,
        created_at: new Date()
      }
    } catch (error) {
      console.error('[GiyaPayService] API createTransaction failed:', error)
      throw error
    }
  }

  async getTransactionsForAPI(options: {
    skip?: number
    take?: number
    order?: Record<string, "ASC" | "DESC">
    vendorId?: string
  } = {}): Promise<any[]> {
    try {
      // Use same connection logic as other ForAPI methods
      let pgConnection
      try {
        // First try the standard container approach
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        console.log('[GiyaPayService] ✅ Transactions: Standard container resolve succeeded')
      } catch (containerError) {
        console.log('[GiyaPayService] Transactions: Standard container failed, trying direct access...')
        try {
          // Try different ways to get the connection
          if (this.container.__pg_connection__) {
            pgConnection = this.container.__pg_connection__
            console.log('[GiyaPayService] ✅ Transactions: Direct __pg_connection__ found')
          } else if (this.container.pgConnection) {
            pgConnection = this.container.pgConnection
            console.log('[GiyaPayService] ✅ Transactions: Direct pgConnection found')
          } else if (this.container._container && this.container._container.resolve) {
            try {
              pgConnection = this.container._container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
              console.log('[GiyaPayService] ✅ Transactions: _container resolve succeeded')
            } catch (e) {
              console.log('[GiyaPayService] Transactions: _container resolve failed:', e.message)
            }
          }
          
          if (!pgConnection) {
            console.log('[GiyaPayService] ❌ Transactions: No pgConnection found, returning empty array')
            return []
          }
        } catch (e) {
          console.log('[GiyaPayService] ❌ Transactions: All connection attempts failed:', e.message)
          return []
        }
      }
      
      // First, ensure the table exists
      await pgConnection.raw(`
        CREATE TABLE IF NOT EXISTS giyapay_transactions (
          id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid()),
          reference_number VARCHAR(255) UNIQUE NOT NULL,
          order_id VARCHAR(255),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'PHP',
          status VARCHAR(20) DEFAULT 'PENDING',
          gateway VARCHAR(50) DEFAULT 'GCASH',
          description TEXT,
          payment_data JSONB,
          vendor_id VARCHAR(255),
          vendor_name VARCHAR(255),
          beneficiary_name VARCHAR(255),
          beneficiary_account VARCHAR(255),
          beneficiary_address TEXT,
          beneficiary_bank_name VARCHAR(255),
          beneficiary_swift_code VARCHAR(255),
          beneficiary_bank_address TEXT,
          remittance_type VARCHAR(50) DEFAULT 'DFT',
          source_account VARCHAR(255),
          purpose TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Ensure new columns exist (idempotent)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS cart_id VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_account VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_address TEXT`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_bank_name VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_swift_code VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS beneficiary_bank_address TEXT`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS remittance_type VARCHAR(50) DEFAULT 'DFT'`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS source_account VARCHAR(255)`)
      await pgConnection.raw(`ALTER TABLE giyapay_transactions ADD COLUMN IF NOT EXISTS purpose TEXT`)
      
      const limit = options.take || 20
      const offset = options.skip || 0
      const orderBy = options.order?.createdAt === 'ASC' ? 'ASC' : 'DESC'
      
      // Build vendor filter
      let whereClause = ''
      const queryParams: any[] = []
      
      if (options.vendorId) {
        whereClause = 'WHERE vendor_id = ?'
        queryParams.push(options.vendorId)
      }
      
      queryParams.push(limit, offset)
      
      const result = await pgConnection.raw(
        `SELECT * FROM giyapay_transactions ${whereClause} ORDER BY created_at ${orderBy} LIMIT ? OFFSET ?`,
        queryParams
      )
      
      const transactions = result.rows.map((row: any) => ({
        id: row.id,
        reference_number: row.reference_number,
        order_id: row.order_id,
        cart_id: row.cart_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        status: row.status,
        gateway: row.gateway,
        description: row.description,
        vendor_id: row.vendor_id,
        vendor_name: row.vendor_name,
        beneficiary_name: row.beneficiary_name,
        beneficiary_account: row.beneficiary_account,
        beneficiary_address: row.beneficiary_address,
        beneficiary_bank_name: row.beneficiary_bank_name,
        beneficiary_swift_code: row.beneficiary_swift_code,
        beneficiary_bank_address: row.beneficiary_bank_address,
        remittance_type: row.remittance_type,
        source_account: row.source_account,
        purpose: row.purpose,
        payment_data: (() => {
          try {
            if (!row.payment_data) return null
            if (typeof row.payment_data === 'object') return row.payment_data
            if (typeof row.payment_data === 'string' && row.payment_data !== '[object Object]') {
              return JSON.parse(row.payment_data)
            }
            return null
          } catch (e) {
            console.log('[GiyaPayService] Failed to parse payment_data for transaction:', row.id, 'data:', row.payment_data)
            return null
          }
        })(),
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
      
      console.log('[GiyaPayService] Retrieved', transactions.length, 'transactions from database')
      return transactions
    } catch (error) {
      console.error('[GiyaPayService] API getTransactions failed:', error)
      return []
    }
  }

  // Method to generate DFT format for MBOS
  async generateDFTReport(options: { 
    take?: number; 
    skip?: number; 
    order?: { createdAt?: 'ASC' | 'DESC' }; 
    dateFrom?: string;
    dateTo?: string;
    vendorId?: string;
  } = {}): Promise<string> {
    try {
      let pgConnection
      try {
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        console.log('[GiyaPayService] ✅ DFT: Standard container resolve succeeded')
      } catch (containerError) {
        console.log('[GiyaPayService] DFT: Standard container failed, trying direct access...')
        if (this.container.__pg_connection__) {
          pgConnection = this.container.__pg_connection__
          console.log('[GiyaPayService] ✅ DFT: Direct __pg_connection__ found')
        } else {
          console.log('[GiyaPayService] ❌ DFT: No pgConnection found')
          throw new Error('Database connection not available')
        }
      }

      // Build filters
      let whereClause = "WHERE status = 'SUCCESS'"
      const queryParams: any[] = []
      
      if (options.vendorId) {
        whereClause += ' AND vendor_id = ?'
        queryParams.push(options.vendorId)
      }
      
      if (options.dateFrom) {
        whereClause += ' AND created_at >= ?'
        queryParams.push(options.dateFrom)
      }
      
      if (options.dateTo) {
        whereClause += ' AND created_at <= ?'
        queryParams.push(options.dateTo)
      }

      const limit = options.take || 1000
      const offset = options.skip || 0
      const orderBy = options.order?.createdAt === 'ASC' ? 'ASC' : 'DESC'
      
      queryParams.push(limit, offset)

      const result = await pgConnection.raw(
        `SELECT * FROM giyapay_transactions ${whereClause} ORDER BY created_at ${orderBy} LIMIT ? OFFSET ?`,
        queryParams
      )

      let dftContent = ''
      
      for (const row of result.rows) {
        const transactionDate = new Date(row.created_at).toISOString().split('T')[0]
        
        // DFT format: D|Remittance Type|Currency|Amount|Source Account|Destination Account Number|1|Beneficiary Code|Beneficiary Name||||Beneficiary Address|SWIFT Code|Beneficiary Bank Address||Purpose|||0|||
        const dftLine = [
          'D', // Fixed prefix
          row.remittance_type || 'DFT', // Remittance Type
          row.currency || 'PHP', // Currency
          (parseFloat(row.amount) || 0).toFixed(2), // Amount
          row.source_account || '', // Source Account
          row.beneficiary_account || '', // Destination Account Number
          '1', // Fixed value
          '', // Beneficiary Code (empty)
          row.beneficiary_name || '', // Beneficiary Name
          '', // Empty field
          '', // Empty field
          '', // Empty field
          '', // Empty field
          row.beneficiary_address || '', // Beneficiary Address
          row.beneficiary_swift_code || '', // SWIFT Code (was Beneficiary Bank)
          row.beneficiary_bank_address || '', // Beneficiary Bank Address
          '', // Empty field
          `DFT ${transactionDate}`, // Purpose: "DFT <Date of GiyaPay Transaction>"
          '', // Empty field
          '', // Empty field
          '0', // Charge Type: "0"
          '', // Empty field
          '', // Empty field
          '' // Empty field
        ].join('|')
        
        dftContent += dftLine + '\n'
      }

      console.log(`[GiyaPayService] Generated DFT report with ${result.rows.length} transactions`)
      return dftContent
      
    } catch (error) {
      console.error('[GiyaPayService] DFT generation failed:', error)
      throw error
    }
  }

  /**
   * Get transactions by vendor ID and status for analytics
   */
  async getTransactionsByVendor(vendorId: string, status?: string): Promise<any[]> {
    try {
      let pgConnection
      try {
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      } catch (containerError) {
        if (this.container.__pg_connection__) {
          pgConnection = this.container.__pg_connection__
        } else {
          console.log('[GiyaPayService] No pgConnection found for vendor analytics')
          return []
        }
      }
      
      let whereClause = 'WHERE vendor_id = ?'
      const params = [vendorId]
      
      if (status) {
        whereClause += ' AND status = ?'
        params.push(status)
      }
      
      const result = await pgConnection.raw(
        `SELECT * FROM giyapay_transactions ${whereClause} ORDER BY created_at DESC`,
        params
      )
      
      return result.rows.map((row: any) => ({
        id: row.id,
        reference_number: row.reference_number,
        amount: parseFloat(row.amount) || 0,
        currency: row.currency,
        status: row.status,
        vendor_id: row.vendor_id,
        vendor_name: row.vendor_name,
        created_at: row.created_at
      }))
    } catch (error) {
      console.error('[GiyaPayService] Error fetching transactions by vendor:', error)
      return []
    }
  }

  /**
   * Get transaction analytics for a vendor
   */
  async getVendorAnalytics(vendorId: string): Promise<{
    totalCaptured: number
    transactionCount: number
    lastTransactionDate: string | null
  }> {
    try {
      const transactions = await this.getTransactionsByVendor(vendorId, 'SUCCESS')
      
      const totalCaptured = transactions.reduce((sum, txn) => {
        return sum + (txn.amount || 0)
      }, 0)
      
      const transactionCount = transactions.length
      const lastTransactionDate = transactions.length > 0 ? transactions[0].created_at : null
      
      return {
        totalCaptured,
        transactionCount,
        lastTransactionDate
      }
    } catch (error) {
      console.error('[GiyaPayService] Error getting vendor analytics:', error)
      return {
        totalCaptured: 0,
        transactionCount: 0,
        lastTransactionDate: null
      }
    }
  }

  /**
   * Get payout records for a vendor
   */
  async getPayoutsByVendor(vendorId: string): Promise<any[]> {
    try {
      let pgConnection
      try {
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      } catch (containerError) {
        if (this.container.__pg_connection__) {
          pgConnection = this.container.__pg_connection__
        } else {
          console.log('[GiyaPayService] No pgConnection found for vendor payouts')
          return []
        }
      }
      
      // For now, we'll simulate payout data based on successful transactions
      // In a real implementation, this would query an actual payouts table
      const result = await pgConnection.raw(
        `SELECT 
          'payout_' || generate_random_uuid() as id,
          vendor_id,
          SUM(amount) as amount,
          'completed' as status,
          MAX(created_at) as created_at,
          'PHP' as currency
         FROM giyapay_transactions 
         WHERE vendor_id = ? AND status = 'SUCCESS' 
         GROUP BY vendor_id
         HAVING SUM(amount) > 0`,
        [vendorId]
      )
      
      // Add some mock pending payouts
      const mockPendingPayouts = [{
        id: `payout_pending_${vendorId}`,
        vendor_id: vendorId,
        amount: 15000, // ₱15,000 pending
        status: 'pending',
        currency: 'PHP',
        created_at: new Date().toISOString()
      }]
      
      return [...(result.rows || []), ...mockPendingPayouts]
    } catch (error) {
      console.error('[GiyaPayService] Error fetching payouts by vendor:', error)
      // Return mock data if database query fails
      return [
        {
          id: `payout_mock_${vendorId}`,
          vendor_id: vendorId,
          amount: 50000, // ₱50,000 completed
          status: 'completed',
          currency: 'PHP',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `payout_pending_${vendorId}`,
          vendor_id: vendorId,
          amount: 25000, // ₱25,000 pending
          status: 'pending',
          currency: 'PHP',
          created_at: new Date().toISOString()
        }
      ]
    }
  }

  /**
   * Generate TAMA format for Metrobank settlements
   */
  async generateTAMAReport(options: { 
    take?: number; 
    skip?: number; 
    order?: { createdAt?: 'ASC' | 'DESC' }; 
    dateFrom?: string;
    dateTo?: string;
    fundingAccount?: string;
  } = {}): Promise<string> {
    try {
      let pgConnection
      try {
        pgConnection = this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        console.log('[GiyaPayService] ✅ TAMA: Standard container resolve succeeded')
      } catch (containerError) {
        console.log('[GiyaPayService] TAMA: Standard container failed, trying direct access...')
        if (this.container.__pg_connection__) {
          pgConnection = this.container.__pg_connection__
          console.log('[GiyaPayService] ✅ TAMA: Direct __pg_connection__ found')
        } else {
          console.log('[GiyaPayService] ❌ TAMA: No pgConnection found')
          throw new Error('Database connection not available')
        }
      }

      // Build filters for Metrobank transactions only
      let whereClause = `WHERE gt.status = 'SUCCESS' 
                         AND s.dft_bank_name ILIKE '%metrobank%' 
                         AND s.dft_account_number IS NOT NULL 
                         AND s.dft_beneficiary_name IS NOT NULL`
      const queryParams: any[] = []
      
      if (options.dateFrom) {
        whereClause += ' AND gt.created_at >= ?'
        queryParams.push(options.dateFrom)
      }
      
      if (options.dateTo) {
        whereClause += ' AND gt.created_at <= ?'
        queryParams.push(options.dateTo)
      }
      
      // Build order clause
      const orderClause = options.order?.createdAt === 'ASC' ? 'ORDER BY gt.created_at ASC' : 'ORDER BY gt.created_at DESC'
      
      // Build limit clause
      let limitClause = ''
      if (options.take) {
        limitClause = `LIMIT ${options.take}`
        if (options.skip) {
          limitClause += ` OFFSET ${options.skip}`
        }
      }

      const query = `
        SELECT 
          gt.id,
          gt.reference_number,
          gt.vendor_id,
          gt.vendor_name,
          gt.amount,
          gt.created_at,
          gt.description,
          s.dft_beneficiary_name,
          s.dft_account_number,
          s.dft_bank_name
        FROM giyapay_transactions gt
        LEFT JOIN seller s ON s.id = gt.vendor_id
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `

      console.log('[GiyaPayService] TAMA Query:', query)
      console.log('[GiyaPayService] TAMA Params:', queryParams)

      const result = await pgConnection.raw(query, queryParams)
      const transactions = result.rows || result || []

      console.log(`[GiyaPayService] TAMA: Found ${transactions.length} Metrobank transactions`)

      if (transactions.length === 0) {
        console.log('[GiyaPayService] ⚠️ No Metrobank transactions found for TAMA report')
        return ''
      }

      const tamaLines: string[] = []
      const fundingAccount = options.fundingAccount || "2467246570570" // Default BIMS account
      const transactionDate = new Date()

      // Helper functions for TAMA formatting
      const formatDate = (date: Date): string => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${month}/${day}/${year}`
      }

      const formatTime = (date: Date): string => {
        let hours = date.getHours()
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // 0 should be 12
        return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`
      }

      const formatAmount = (amount: number): string => {
        // Convert to centavos and format with decimal point
        const centavos = Math.round(amount * 100)
        const formatted = centavos.toString()
        if (formatted.length <= 2) {
          return `0.${formatted.padStart(2, '0')}`
        }
        return `${formatted.slice(0, -2)}.${formatted.slice(-2)}`
      }

      // Generate header record (H)
      const formattedDate = formatDate(transactionDate)
      const formattedTime = formatTime(transactionDate)
      tamaLines.push(`H|${fundingAccount}|${formattedDate}|${formattedTime}`)

      // Generate detail records (D) for each transaction
      for (const transaction of transactions) {
        const amount = parseFloat(transaction.amount)
        const formattedAmount = formatAmount(amount)
        
        // Parse beneficiary name (assume format: "LAST NAME, FIRST NAME" or "FIRST NAME LAST NAME")
        let lastName = ''
        let firstName = ''
        
        if (transaction.dft_beneficiary_name) {
          const nameParts = transaction.dft_beneficiary_name.trim().split(/[,\s]+/)
          if (nameParts.length >= 2) {
            if (transaction.dft_beneficiary_name.includes(',')) {
              // Format: "LAST, FIRST MIDDLE"
              lastName = nameParts[0].trim()
              firstName = nameParts.slice(1).join(' ').trim()
            } else {
              // Format: "FIRST MIDDLE LAST" - assume last word is last name
              lastName = nameParts[nameParts.length - 1]
              firstName = nameParts.slice(0, -1).join(' ')
            }
          } else {
            // Single name - use as first name
            firstName = transaction.dft_beneficiary_name.trim()
          }
        }

        // TAMA format: D||Reference Number|Last Name|First Name||Destination Account|Amount|Remarks
        const detailRecord = `D||${transaction.reference_number}|${lastName}|${firstName}||${transaction.dft_account_number}|${formattedAmount}|${transaction.description || 'MARETINDA SETTLEMENT'}`
        tamaLines.push(detailRecord)
      }

      console.log(`[GiyaPayService] ✅ TAMA report generated successfully (${tamaLines.length} lines)`)
      return tamaLines.join('\n')
      
    } catch (error) {
      console.error('[GiyaPayService] ❌ TAMA report generation failed:', error)
      throw new Error(`TAMA report generation failed: ${error.message}`)
    }
  }
}

export default GiyaPayService