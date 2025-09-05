import { ShippingProviderConfig, ShippingProviderType } from '../interfaces/shipping-provider.interface'

/**
 * Shipping configuration manager
 * Handles provider configurations and settings
 */
export class ShippingConfigManager {
  private static instance: ShippingConfigManager
  private configs: Map<string, ShippingProviderConfig> = new Map()

  private constructor() {}

  static getInstance(): ShippingConfigManager {
    if (!ShippingConfigManager.instance) {
      ShippingConfigManager.instance = new ShippingConfigManager()
    }
    return ShippingConfigManager.instance
  }

  /**
   * Get default configurations for all providers
   */
  getDefaultConfigurations(): ShippingProviderConfig[] {
    return [
      this.getLalamoveDefaultConfig(),
      this.getDHLDefaultConfig(),
      // Add more default configs as providers are implemented
    ]
  }

  /**
   * Lalamove default configuration
   */
  private getLalamoveDefaultConfig(): ShippingProviderConfig {
    return {
      providerId: 'lalamove',
      name: 'Lalamove',
      type: ShippingProviderType.SAME_DAY,
      enabled: false, // Disabled by default until configured
      priority: 10,
      configuration: {
        apiKey: process.env.LALAMOVE_API_KEY || '',
        apiSecret: process.env.LALAMOVE_API_SECRET || '',
        market: process.env.LALAMOVE_MARKET || 'HK',
        environment: process.env.LALAMOVE_ENVIRONMENT || 'sandbox',
        webhookUrl: process.env.LALAMOVE_WEBHOOK_URL || ''
      },
      supportedMarkets: ['HK', 'SG', 'MY', 'TH', 'PH', 'VN', 'TW', 'ID', 'BR', 'MX'],
      supportedServiceTypes: [
        'MOTORCYCLE',
        'SEDAN',
        'COURIER',
        'VAN',
        'TRUCK',
        'WALKER'
      ],
      webhookUrl: process.env.LALAMOVE_WEBHOOK_URL
    }
  }

  /**
   * DHL default configuration
   */
  private getDHLDefaultConfig(): ShippingProviderConfig {
    return {
      providerId: 'dhl',
      name: 'DHL Express',
      type: ShippingProviderType.EXPRESS,
      enabled: false, // Disabled by default until configured
      priority: 8,
      configuration: {
        apiKey: process.env.DHL_API_KEY || '',
        apiSecret: process.env.DHL_API_SECRET || '',
        accountNumber: process.env.DHL_ACCOUNT_NUMBER || '',
        environment: process.env.DHL_ENVIRONMENT || 'test'
      },
      supportedMarkets: ['GLOBAL'], // DHL supports global shipping
      supportedServiceTypes: [
        'EXPRESS_WORLDWIDE',
        'EXPRESS_12:00',
        'EXPRESS_9:00',
        'EXPRESS_ENVELOPE',
        'DOMESTIC_EXPRESS'
      ],
      webhookUrl: process.env.DHL_WEBHOOK_URL
    }
  }

  /**
   * FedEx default configuration template
   */
  getFedExDefaultConfig(): ShippingProviderConfig {
    return {
      providerId: 'fedex',
      name: 'FedEx',
      type: ShippingProviderType.EXPRESS,
      enabled: false,
      priority: 7,
      configuration: {
        apiKey: process.env.FEDEX_API_KEY || '',
        apiSecret: process.env.FEDEX_API_SECRET || '',
        accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '',
        meterNumber: process.env.FEDEX_METER_NUMBER || '',
        environment: process.env.FEDEX_ENVIRONMENT || 'test'
      },
      supportedMarkets: ['GLOBAL'],
      supportedServiceTypes: [
        'FEDEX_STANDARD_OVERNIGHT',
        'FEDEX_PRIORITY_OVERNIGHT',
        'FEDEX_2_DAY',
        'FEDEX_GROUND',
        'FEDEX_INTERNATIONAL_PRIORITY'
      ],
      webhookUrl: process.env.FEDEX_WEBHOOK_URL
    }
  }

  /**
   * UPS default configuration template
   */
  getUPSDefaultConfig(): ShippingProviderConfig {
    return {
      providerId: 'ups',
      name: 'UPS',
      type: ShippingProviderType.STANDARD,
      enabled: false,
      priority: 6,
      configuration: {
        apiKey: process.env.UPS_API_KEY || '',
        username: process.env.UPS_USERNAME || '',
        password: process.env.UPS_PASSWORD || '',
        accountNumber: process.env.UPS_ACCOUNT_NUMBER || '',
        environment: process.env.UPS_ENVIRONMENT || 'test'
      },
      supportedMarkets: ['GLOBAL'],
      supportedServiceTypes: [
        'UPS_NEXT_DAY_AIR',
        'UPS_2ND_DAY_AIR',
        'UPS_GROUND',
        'UPS_WORLDWIDE_EXPRESS',
        'UPS_STANDARD'
      ],
      webhookUrl: process.env.UPS_WEBHOOK_URL
    }
  }

  /**
   * Local courier default configuration template
   */
  getLocalCourierDefaultConfig(): ShippingProviderConfig {
    return {
      providerId: 'local_courier',
      name: 'Local Courier Service',
      type: ShippingProviderType.SAME_DAY,
      enabled: false,
      priority: 5,
      configuration: {
        baseUrl: process.env.LOCAL_COURIER_API_URL || '',
        apiKey: process.env.LOCAL_COURIER_API_KEY || '',
        username: process.env.LOCAL_COURIER_USERNAME || '',
        password: process.env.LOCAL_COURIER_PASSWORD || ''
      },
      supportedMarkets: ['MY'], // Customize based on local service area
      supportedServiceTypes: [
        'SAME_DAY',
        'NEXT_DAY',
        'EXPRESS'
      ],
      webhookUrl: process.env.LOCAL_COURIER_WEBHOOK_URL
    }
  }

  /**
   * Validate provider configuration
   */
  validateConfiguration(config: ShippingProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Basic validation
    if (!config.providerId) {
      errors.push('Provider ID is required')
    }

    if (!config.name) {
      errors.push('Provider name is required')
    }

    if (!config.type) {
      errors.push('Provider type is required')
    }

    if (!config.supportedMarkets?.length) {
      errors.push('At least one supported market is required')
    }

    if (!config.supportedServiceTypes?.length) {
      errors.push('At least one supported service type is required')
    }

    if (config.priority < 0 || config.priority > 100) {
      errors.push('Priority must be between 0 and 100')
    }

    // Provider-specific validation
    errors.push(...this.validateProviderSpecificConfig(config))

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Provider-specific configuration validation
   */
  private validateProviderSpecificConfig(config: ShippingProviderConfig): string[] {
    const errors: string[] = []

    switch (config.providerId) {
      case 'lalamove':
        if (!config.configuration.apiKey) {
          errors.push('Lalamove API key is required')
        }
        if (!config.configuration.apiSecret) {
          errors.push('Lalamove API secret is required')
        }
        if (!config.configuration.market) {
          errors.push('Lalamove market is required')
        }
        break

      case 'dhl':
        if (!config.configuration.apiKey) {
          errors.push('DHL API key is required')
        }
        if (!config.configuration.apiSecret) {
          errors.push('DHL API secret is required')
        }
        if (!config.configuration.accountNumber) {
          errors.push('DHL account number is required')
        }
        break

      case 'fedex':
        if (!config.configuration.apiKey) {
          errors.push('FedEx API key is required')
        }
        if (!config.configuration.accountNumber) {
          errors.push('FedEx account number is required')
        }
        if (!config.configuration.meterNumber) {
          errors.push('FedEx meter number is required')
        }
        break

      case 'ups':
        if (!config.configuration.apiKey) {
          errors.push('UPS API key is required')
        }
        if (!config.configuration.username) {
          errors.push('UPS username is required')
        }
        if (!config.configuration.password) {
          errors.push('UPS password is required')
        }
        break
    }

    return errors
  }

  /**
   * Generate sample configuration for testing
   */
  generateSampleConfig(providerId: string): ShippingProviderConfig | null {
    switch (providerId) {
      case 'lalamove':
        return {
          ...this.getLalamoveDefaultConfig(),
          enabled: true,
          configuration: {
            ...this.getLalamoveDefaultConfig().configuration,
            apiKey: 'pk_test_sample_key',
            apiSecret: 'sk_test_sample_secret',
            market: 'HK',
            environment: 'sandbox'
          }
        }

      case 'dhl':
        return {
          ...this.getDHLDefaultConfig(),
          enabled: true,
          configuration: {
            ...this.getDHLDefaultConfig().configuration,
            apiKey: 'sample_dhl_api_key',
            apiSecret: 'sample_dhl_api_secret',
            accountNumber: '123456789',
            environment: 'test'
          }
        }

      default:
        return null
    }
  }

  /**
   * Get configuration template with descriptions
   */
  getConfigurationTemplate(providerId: string): any {
    const templates: Record<string, any> = {
      lalamove: {
        apiKey: {
          type: 'string',
          required: true,
          description: 'Lalamove API key from Partner Portal',
          example: 'pk_test_xxxxxxxxxxxxxxxx'
        },
        apiSecret: {
          type: 'string',
          required: true,
          description: 'Lalamove API secret from Partner Portal',
          example: 'sk_test_xxxxxxxxxxxxxxxx'
        },
        market: {
          type: 'string',
          required: true,
          description: 'Market code (e.g., HK, SG, MY)',
          example: 'HK'
        },
        environment: {
          type: 'string',
          required: false,
          description: 'API environment (sandbox or production)',
          example: 'sandbox',
          default: 'sandbox'
        },
        webhookUrl: {
          type: 'string',
          required: false,
          description: 'Webhook URL for order updates',
          example: 'https://your-domain.com/webhooks/lalamove'
        }
      },
      dhl: {
        apiKey: {
          type: 'string',
          required: true,
          description: 'DHL API key',
          example: 'demo-key'
        },
        apiSecret: {
          type: 'string',
          required: true,
          description: 'DHL API secret',
          example: 'demo-secret'
        },
        accountNumber: {
          type: 'string',
          required: true,
          description: 'DHL account number',
          example: '123456789'
        },
        environment: {
          type: 'string',
          required: false,
          description: 'API environment (test or production)',
          example: 'test',
          default: 'test'
        }
      },
      jnt: {
        apiKey: {
          type: 'string',
          required: true,
          description: 'J&T Express API key from merchant portal',
          example: 'your-jnt-api-key'
        },
        customerCode: {
          type: 'string',
          required: true,
          description: 'J&T Express customer code',
          example: 'CUSTOMER123'
        },
        environment: {
          type: 'string',
          required: false,
          description: 'API environment (sandbox or production)',
          example: 'sandbox',
          default: 'sandbox'
        },
        region: {
          type: 'string',
          required: true,
          description: 'Operating region (MY, SG, TH, VN, PH, ID, KH)',
          example: 'MY'
        },
        webhookUrl: {
          type: 'string',
          required: false,
          description: 'Webhook URL for order updates',
          example: 'https://your-domain.com/webhooks/jnt'
        }
      },
      ninjavan: {
        apiKey: {
          type: 'string',
          required: true,
          description: 'Ninja Van API key from merchant dashboard',
          example: 'your-ninjavan-api-key'
        },
        clientId: {
          type: 'string',
          required: true,
          description: 'Ninja Van client ID',
          example: 'your-client-id'
        },
        clientSecret: {
          type: 'string',
          required: true,
          description: 'Ninja Van client secret',
          example: 'your-client-secret'
        },
        environment: {
          type: 'string',
          required: false,
          description: 'API environment (sandbox or production)',
          example: 'sandbox',
          default: 'sandbox'
        },
        region: {
          type: 'string',
          required: true,
          description: 'Operating region (MY, SG, TH, VN, PH, ID)',
          example: 'MY'
        },
        webhookUrl: {
          type: 'string',
          required: false,
          description: 'Webhook URL for order updates',
          example: 'https://your-domain.com/webhooks/ninjavan'
        }
      }
    }

    return templates[providerId] || {}
  }

  /**
   * Get all available provider templates
   */
  getAllProviderTemplates(): Record<string, any> {
    return {
      lalamove: {
        name: 'Lalamove',
        description: 'Same-day delivery service across Asia and Latin America',
        type: ShippingProviderType.SAME_DAY,
        capabilities: [
          'Real-time tracking',
          'Proof of delivery',
          'Multiple destinations',
          'Priority fees',
          'Driver change'
        ],
        markets: ['HK', 'SG', 'MY', 'TH', 'PH', 'VN', 'TW', 'ID', 'BR', 'MX'],
        configTemplate: this.getConfigurationTemplate('lalamove')
      },
      dhl: {
        name: 'DHL Express',
        description: 'Global express delivery and logistics',
        type: ShippingProviderType.EXPRESS,
        capabilities: [
          'Global coverage',
          'Express delivery',
          'Insurance',
          'Tracking'
        ],
        markets: ['GLOBAL'],
        configTemplate: this.getConfigurationTemplate('dhl')
      },
      fedex: {
        name: 'FedEx',
        description: 'International express delivery service',
        type: ShippingProviderType.EXPRESS,
        capabilities: [
          'Global coverage',
          'Express delivery',
          'Insurance',
          'Tracking',
          'Signature confirmation'
        ],
        markets: ['GLOBAL'],
        configTemplate: this.getConfigurationTemplate('fedex')
      },
      ups: {
        name: 'UPS',
        description: 'Global logistics and package delivery',
        type: ShippingProviderType.STANDARD,
        capabilities: [
          'Global coverage',
          'Ground and air services',
          'Insurance',
          'Tracking'
        ],
        markets: ['GLOBAL'],
        configTemplate: this.getConfigurationTemplate('ups')
      },
      jnt: {
        name: 'J&T Express',
        description: 'Leading express delivery service across Southeast Asia',
        type: ShippingProviderType.EXPRESS,
        capabilities: [
          'Real-time tracking',
          'Proof of delivery',
          'Cash on delivery',
          'Insurance coverage',
          'Express delivery'
        ],
        markets: ['MY', 'SG', 'TH', 'VN', 'PH', 'ID', 'KH'],
        configTemplate: this.getConfigurationTemplate('jnt')
      },
      ninjavan: {
        name: 'Ninja Van',
        description: 'Last-mile delivery platform across Southeast Asia',
        type: ShippingProviderType.SAME_DAY,
        capabilities: [
          'Real-time tracking',
          'Proof of delivery',
          'Cash on delivery',
          'Same-day delivery',
          'Next-day delivery'
        ],
        markets: ['MY', 'SG', 'TH', 'VN', 'PH', 'ID'],
        configTemplate: this.getConfigurationTemplate('ninjavan')
      }
    }
  }
}

