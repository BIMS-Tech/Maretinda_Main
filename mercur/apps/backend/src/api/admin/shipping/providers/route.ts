import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MultiVendorShippingService, ShippingConfigManager } from '@mercurjs/shipping'

/**
 * Admin API for managing shipping providers
 */

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const shippingService = new MultiVendorShippingService(req.scope)
    const configManager = ShippingConfigManager.getInstance()

    const { provider_id } = req.query

    if (provider_id) {
      // Get specific provider configuration
      const providers = shippingService.getConfiguredProviders()
      const provider = providers.find(p => p.providerId === provider_id)
      
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' })
      }

      return res.json({ provider })
    }

    // Get all configured providers
    const configuredProviders = shippingService.getConfiguredProviders()
    const availableTemplates = configManager.getAllProviderTemplates()

    return res.json({
      configuredProviders,
      availableTemplates
    })
  } catch (error) {
    console.error('Error fetching shipping providers:', error)
    return res.status(500).json({
      message: 'Failed to fetch shipping providers',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest<{
    providerId: string
    name: string
    type: string
    enabled: boolean
    priority: number
    configuration: Record<string, any>
    supportedMarkets: string[]
    supportedServiceTypes: string[]
    webhookUrl?: string
  }>,
  res: MedusaResponse
) => {
  try {
    const shippingService = new MultiVendorShippingService(req.scope)
    const configManager = ShippingConfigManager.getInstance()

    const providerConfig = req.validatedBody

    // Validate configuration
    const validation = configManager.validateConfiguration(providerConfig)
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Invalid provider configuration',
        errors: validation.errors
      })
    }

    // Configure the provider
    await shippingService.configureProvider(providerConfig)

    return res.status(201).json({
      message: 'Provider configured successfully',
      provider: providerConfig
    })
  } catch (error) {
    console.error('Error configuring shipping provider:', error)
    return res.status(500).json({
      message: 'Failed to configure shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const PUT = async (
  req: AuthenticatedMedusaRequest<{
    providerId: string
    name?: string
    enabled?: boolean
    priority?: number
    configuration?: Record<string, any>
    supportedMarkets?: string[]
    supportedServiceTypes?: string[]
    webhookUrl?: string
  }>,
  res: MedusaResponse
) => {
  try {
    const shippingService = new MultiVendorShippingService(req.scope)
    const configManager = ShippingConfigManager.getInstance()

    const { providerId, ...updates } = req.validatedBody

    // Get existing configuration
    const existingProviders = shippingService.getConfiguredProviders()
    const existingProvider = existingProviders.find(p => p.providerId === providerId)

    if (!existingProvider) {
      return res.status(404).json({ message: 'Provider not found' })
    }

    // Merge updates with existing configuration
    const updatedConfig = {
      ...existingProvider,
      ...updates
    }

    // Validate updated configuration
    const validation = configManager.validateConfiguration(updatedConfig)
    if (!validation.valid) {
      return res.status(400).json({
        message: 'Invalid provider configuration',
        errors: validation.errors
      })
    }

    // Update the provider
    await shippingService.configureProvider(updatedConfig)

    return res.json({
      message: 'Provider updated successfully',
      provider: updatedConfig
    })
  } catch (error) {
    console.error('Error updating shipping provider:', error)
    return res.status(500).json({
      message: 'Failed to update shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { provider_id } = req.query

    if (!provider_id) {
      return res.status(400).json({ message: 'Provider ID is required' })
    }

    // Disable the provider instead of deleting
    const shippingService = new MultiVendorShippingService(req.scope)
    const existingProviders = shippingService.getConfiguredProviders()
    const existingProvider = existingProviders.find(p => p.providerId === provider_id)

    if (!existingProvider) {
      return res.status(404).json({ message: 'Provider not found' })
    }

    const disabledConfig = {
      ...existingProvider,
      enabled: false
    }

    await shippingService.configureProvider(disabledConfig)

    return res.json({
      message: 'Provider disabled successfully'
    })
  } catch (error) {
    console.error('Error disabling shipping provider:', error)
    return res.status(500).json({
      message: 'Failed to disable shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

