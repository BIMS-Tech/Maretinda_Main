import { Container, Heading, Text, Button, Badge, StatusBadge, Input, Select, Switch, toast } from "@medusajs/ui"
import { Plus, CogSixTooth, CheckCircle, XCircle } from "@medusajs/icons"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form } from "../../../components/common/form"

interface ShippingProvider {
  providerId: string
  name: string
  description: string
  type: string
  capabilities: string[]
  markets: string[]
  configTemplate: any
  isVendorConfigurable: boolean
  requiresCredentials: boolean
  setupInstructions: string[]
}

interface VendorShippingSetup {
  availableProviders: ShippingProvider[]
  vendorConfiguration: any
  credentials: any[]
  setupStatus: any
}

// Mock data for demonstration
const mockSetupData: VendorShippingSetup = {
  availableProviders: [
    {
      providerId: "lalamove",
      name: "Lalamove",
      description: "Same-day delivery service across Asia",
      type: "same_day",
      capabilities: ["Real-time tracking", "Proof of delivery", "Multiple destinations"],
      markets: ["HK", "SG", "MY", "TH", "PH", "VN"],
      configTemplate: {
        apiKey: { type: 'string', required: true, description: 'Lalamove API key' },
        apiSecret: { type: 'string', required: true, description: 'Lalamove API secret' },
        market: { type: 'string', required: true, description: 'Market code (e.g., MY, SG)' }
      },
      isVendorConfigurable: true,
      requiresCredentials: true,
      setupInstructions: [
        "Sign up for a Lalamove Partner account",
        "Complete business verification",
        "Get API credentials from Partner Portal",
        "Choose your operating market"
      ]
    },
    {
      providerId: "jnt",
      name: "J&T Express",
      description: "Leading express delivery service across Southeast Asia",
      type: "express",
      capabilities: ["Real-time tracking", "Proof of delivery", "Cash on delivery", "Insurance"],
      markets: ["MY", "SG", "TH", "VN", "PH", "ID", "KH"],
      configTemplate: {
        apiKey: { type: 'string', required: true, description: 'J&T Express API key' },
        customerCode: { type: 'string', required: true, description: 'Customer code' },
        region: { type: 'string', required: true, description: 'Operating region' }
      },
      isVendorConfigurable: true,
      requiresCredentials: true,
      setupInstructions: [
        "Register as J&T Express merchant",
        "Complete business verification",
        "Obtain API key and customer code",
        "Set up collection points"
      ]
    },
    {
      providerId: "ninjavan",
      name: "Ninja Van",
      description: "Last-mile delivery platform across Southeast Asia",
      type: "same_day",
      capabilities: ["Real-time tracking", "Proof of delivery", "Same-day delivery", "Next-day delivery"],
      markets: ["MY", "SG", "TH", "VN", "PH", "ID"],
      configTemplate: {
        apiKey: { type: 'string', required: true, description: 'Ninja Van API key' },
        clientId: { type: 'string', required: true, description: 'Client ID' },
        clientSecret: { type: 'string', required: true, description: 'Client secret' },
        region: { type: 'string', required: true, description: 'Operating region' }
      },
      isVendorConfigurable: true,
      requiresCredentials: true,
      setupInstructions: [
        "Sign up as Ninja Van merchant",
        "Complete merchant onboarding",
        "Get API credentials from dashboard",
        "Set up pickup locations"
      ]
    }
  ],
  vendorConfiguration: {
    vendorId: "vendor_001",
    enabledProviders: [],
    defaultProvider: null,
    preferences: {
      autoSelectBestRate: true,
      maxCostThreshold: null,
      preferredServiceTypes: [],
      blacklistedProviders: []
    },
    billingConfig: {
      paymentMethod: "vendor-direct",
      costMarkup: 0,
      handlingFee: 0
    }
  },
  credentials: [
    { providerId: "lalamove", hasCredentials: false, isActive: false },
    { providerId: "jnt", hasCredentials: false, isActive: false },
    { providerId: "ninjavan", hasCredentials: false, isActive: false }
  ],
  setupStatus: {
    hasAnyCredentials: false,
    enabledProvidersCount: 0,
    recommendedNextSteps: [
      "Configure your first shipping provider",
      "Test the connection",
      "Enable the provider and set as default"
    ]
  }
}

export const ShippingSetup = () => {
  const [setupData] = useState<VendorShippingSetup>(mockSetupData)
  const [selectedProvider, setSelectedProvider] = useState<ShippingProvider | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({})

  const getProviderStatus = (providerId: string) => {
    const credential = setupData.credentials.find(c => c.providerId === providerId)
    const isEnabled = setupData.vendorConfiguration.enabledProviders.includes(providerId)
    const isDefault = setupData.vendorConfiguration.defaultProvider === providerId

    if (!credential?.hasCredentials) return { status: 'not_configured', color: 'red', text: 'Not Configured' }
    if (!isEnabled) return { status: 'configured', color: 'orange', text: 'Configured' }
    if (isDefault) return { status: 'default', color: 'blue', text: 'Default Provider' }
    return { status: 'enabled', color: 'green', text: 'Enabled' }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'same_day': return 'bg-green-100 text-green-800'
      case 'express': return 'bg-blue-100 text-blue-800'
      case 'standard': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConfigureProvider = (provider: ShippingProvider) => {
    setSelectedProvider(provider)
    setShowConfigModal(true)
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">Shipping Provider Setup</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Configure your own shipping provider accounts for better rates and control
          </Text>
        </div>
      </div>

      {/* Setup Status Overview */}
      <div className="border-t border-ui-border-base p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-ui-bg-subtle">
            <Text className="font-semibold text-sm">Configured Providers</Text>
            <Text className="text-2xl font-bold text-ui-fg-base">
              {setupData.credentials.filter(c => c.hasCredentials).length}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              of {setupData.availableProviders.length} available
            </Text>
          </div>
          
          <div className="p-4 rounded-lg border bg-ui-bg-subtle">
            <Text className="font-semibold text-sm">Enabled Providers</Text>
            <Text className="text-2xl font-bold text-ui-fg-base">
              {setupData.setupStatus.enabledProvidersCount}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              Active for quotations
            </Text>
          </div>
          
          <div className="p-4 rounded-lg border bg-ui-bg-subtle">
            <Text className="font-semibold text-sm">Billing Method</Text>
            <Text className="text-lg font-bold text-ui-fg-base">
              {setupData.vendorConfiguration.billingConfig.paymentMethod === 'vendor-direct' ? 'Direct' : 'Marketplace'}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              Payment responsibility
            </Text>
          </div>
        </div>

        {/* Recommended Next Steps */}
        {setupData.setupStatus.recommendedNextSteps.length > 0 && (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 mb-6">
            <Text className="font-medium text-blue-900 mb-2">Recommended Next Steps:</Text>
            <ul className="space-y-1">
              {setupData.setupStatus.recommendedNextSteps.map((step, index) => (
                <li key={index} className="text-sm text-blue-800">
                  {index + 1}. {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Available Providers */}
      <div className="border-t border-ui-border-base p-6">
        <Heading level="h3" className="mb-4">Available Shipping Providers</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setupData.availableProviders.map((provider) => {
            const status = getProviderStatus(provider.providerId)
            
            return (
              <div
                key={provider.providerId}
                className="rounded-lg border border-ui-border-base p-4 hover:border-ui-border-strong transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Text className="font-semibold">{provider.name}</Text>
                      <Badge size="2xsmall" className={getTypeColor(provider.type)}>
                        {provider.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Text className="text-xs text-ui-fg-muted mb-2">
                      {provider.description}
                    </Text>
                  </div>
                  
                  <StatusBadge color={status.color}>
                    {status.text}
                  </StatusBadge>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <Text className="text-xs font-medium text-ui-fg-subtle mb-1">Markets:</Text>
                    <Text className="text-xs text-ui-fg-muted">
                      {provider.markets.join(', ')}
                    </Text>
                  </div>
                  
                  <div>
                    <Text className="text-xs font-medium text-ui-fg-subtle mb-1">Capabilities:</Text>
                    <div className="flex flex-wrap gap-1">
                      {provider.capabilities.slice(0, 2).map((capability) => (
                        <Badge key={capability} size="2xsmall" variant="neutral">
                          {capability}
                        </Badge>
                      ))}
                      {provider.capabilities.length > 2 && (
                        <Badge size="2xsmall" variant="neutral">
                          +{provider.capabilities.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant={status.status === 'not_configured' ? 'primary' : 'secondary'}
                    onClick={() => handleConfigureProvider(provider)}
                    className="flex-1"
                  >
                    {status.status === 'not_configured' ? (
                      <>
                        <Plus className="h-3 w-3" />
                        Setup
                      </>
                    ) : (
                      <>
                        <CogSixTooth className="h-3 w-3" />
                        Configure
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <ProviderConfigModal
          provider={selectedProvider}
          onClose={() => {
            setShowConfigModal(false)
            setSelectedProvider(null)
          }}
        />
      )}
    </Container>
  )
}

// Provider Configuration Modal Component
const ProviderConfigModal = ({ 
  provider, 
  onClose 
}: { 
  provider: ShippingProvider
  onClose: () => void 
}) => {
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create dynamic schema based on provider config template
  const createSchema = () => {
    const schemaFields: Record<string, any> = {}
    
    Object.entries(provider.configTemplate).forEach(([key, config]: [string, any]) => {
      if (config.required) {
        schemaFields[key] = z.string().min(1, `${config.description} is required`)
      } else {
        schemaFields[key] = z.string().optional()
      }
    })
    
    return z.object(schemaFields)
  }

  const form = useForm({
    resolver: zodResolver(createSchema()),
    defaultValues: Object.keys(provider.configTemplate).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {} as Record<string, string>)
  })

  const handleSubmit = async (values: Record<string, string>) => {
    setIsSubmitting(true)
    try {
      // In real implementation, this would call the API
      console.log('Configuring provider:', provider.providerId, values)
      toast.success(`${provider.name} configured successfully!`)
      onClose()
    } catch (error) {
      toast.error('Failed to configure provider')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h3">Configure {provider.name}</Heading>
              <Text className="text-ui-fg-subtle mt-1">{provider.description}</Text>
            </div>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </div>

        <div className="p-6">
          {/* Setup Instructions */}
          <div className="mb-6 p-4 rounded-lg bg-ui-bg-subtle">
            <Text className="font-medium mb-2">Setup Instructions:</Text>
            <ol className="space-y-1">
              {provider.setupInstructions.map((instruction, index) => (
                <li key={index} className="text-sm text-ui-fg-muted">
                  {index + 1}. {instruction}
                </li>
              ))}
            </ol>
          </div>

          {/* Configuration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {Object.entries(provider.configTemplate).map(([fieldName, config]: [string, any]) => (
                <Form.Field
                  key={fieldName}
                  name={fieldName}
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {config.description}
                        {config.required && <span className="text-red-500 ml-1">*</span>}
                      </Form.Label>
                      <Form.Control>
                        <div className="relative">
                          <Input
                            {...field}
                            type={fieldName.toLowerCase().includes('secret') || fieldName.toLowerCase().includes('password') 
                              ? (showPassword[fieldName] ? 'text' : 'password') 
                              : 'text'
                            }
                            placeholder={config.example || `Enter ${config.description.toLowerCase()}`}
                          />
                          {(fieldName.toLowerCase().includes('secret') || fieldName.toLowerCase().includes('password')) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="small"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                              onClick={() => togglePasswordVisibility(fieldName)}
                            >
                              {showPassword[fieldName] ? 'Hide' : 'Show'}
                            </Button>
                          )}
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage />
                      {config.example && (
                        <Form.Description>
                          Example: {config.example}
                        </Form.Description>
                      )}
                    </Form.Item>
                  )}
                />
              ))}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
                  Configure Provider
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
