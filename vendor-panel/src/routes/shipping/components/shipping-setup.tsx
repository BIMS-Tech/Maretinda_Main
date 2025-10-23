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
  credentialLinks?: {
    signupUrl: string
    dashboardUrl: string
    apiDocsUrl: string
    supportUrl: string
  }
  helpNotes?: string[]
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
        apiKey: { 
          type: 'string', 
          required: true, 
          description: 'Lalamove API key',
          helpText: 'Found in Developer Settings > API Keys section',
          credentialPath: 'Developer Settings → API Keys → Create New API Key'
        },
        apiSecret: { 
          type: 'string', 
          required: true, 
          description: 'Lalamove API secret',
          helpText: 'Generated when you create a new API key',
          credentialPath: 'Developer Settings → API Keys → Copy Secret (shown once)'
        },
        market: { 
          type: 'string', 
          required: true, 
          description: 'Market code (e.g., MY, SG)',
          helpText: 'Your primary operating market from account settings',
          example: 'PH, MY, SG, TH'
        }
      },
      isVendorConfigurable: true,
      requiresCredentials: true,
      setupInstructions: [
        "Sign up for a Lalamove Partner account at partner.lalamove.com",
        "Complete business verification (takes 1-3 business days)",
        "Access Developer Settings in your partner dashboard",
        "Generate API credentials and copy both API key and secret"
      ],
      credentialLinks: {
        signupUrl: "https://partner.lalamove.com/register",
        dashboardUrl: "https://partner.lalamove.com/dashboard",
        apiDocsUrl: "https://developers.lalamove.com/docs",
        supportUrl: "https://partner.lalamove.com/support"
      },
      helpNotes: [
        "💡 API credentials are only shown once - save them securely",
        "📍 Make sure your business address matches your selected market",
        "⏱️ Business verification typically takes 1-3 business days",
        "💰 Check rate cards for your market before integration"
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
        apiKey: { 
          type: 'string', 
          required: true, 
          description: 'J&T Express API key',
          helpText: 'Available in Merchant Portal under API Management',
          credentialPath: 'Merchant Portal → Settings → API Management → Generate API Key'
        },
        customerCode: { 
          type: 'string', 
          required: true, 
          description: 'Customer code',
          helpText: 'Your unique merchant ID provided during onboarding',
          credentialPath: 'Merchant Portal → Account Info → Customer Code'
        },
        region: { 
          type: 'string', 
          required: true, 
          description: 'Operating region',
          helpText: 'Your primary service region',
          example: 'PH, MY, SG, TH, VN, ID'
        }
      },
      isVendorConfigurable: true,
      requiresCredentials: true,
      setupInstructions: [
        "Register as J&T Express merchant at merchant.jtexpress.com",
        "Submit required business documents for verification",
        "Wait for account approval (2-5 business days)",
        "Access API Management section to generate credentials"
      ],
      credentialLinks: {
        signupUrl: "https://merchant.jtexpress.com/register",
        dashboardUrl: "https://merchant.jtexpress.com/dashboard",
        apiDocsUrl: "https://api.jtexpress.com/docs",
        supportUrl: "https://merchant.jtexpress.com/support"
      },
      helpNotes: [
        "📋 Have your business registration documents ready",
        "🏪 Physical pickup location address is required",
        "💳 Credit application may be needed for COD services",
        "📞 Contact local J&T sales team for better rates"
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
        apiKey: { 
          type: 'string', 
          required: true, 
          description: 'Ninja Van API key',
          helpText: 'Found in Shipper Portal under Developer Settings',
          credentialPath: 'Shipper Portal → Settings → Developer → API Keys'
        },
        clientId: { 
          type: 'string', 
          required: true, 
          description: 'Client ID',
          helpText: 'Your application client identifier',
          credentialPath: 'Shipper Portal → Settings → Developer → Client Credentials'
        },
        clientSecret: { 
          type: 'string', 
          required: true, 
          description: 'Client secret',
          helpText: 'Secret key for authentication (keep confidential)',
          credentialPath: 'Shipper Portal → Settings → Developer → Client Secret'
        },
        region: { 
          type: 'string', 
          required: true, 
          description: 'Operating region',
          helpText: 'Your primary service market',
          example: 'PH, MY, SG, TH, VN, ID'
        }
      },
      isVendorConfigurable: true,
      requiresCredentials: true,
      setupInstructions: [
        "Register at shipper.ninjavan.co and complete onboarding",
        "Upload business documents and wait for verification",
        "Set up pickup locations and contact information",
        "Access Developer Settings to generate API credentials"
      ],
      credentialLinks: {
        signupUrl: "https://shipper.ninjavan.co/register",
        dashboardUrl: "https://shipper.ninjavan.co/dashboard",
        apiDocsUrl: "https://api-docs.ninjavan.co",
        supportUrl: "https://support.ninjavan.co"
      },
      helpNotes: [
        "🆔 Business registration number is mandatory",
        "📦 Set up default packaging preferences",
        "💰 Volume discounts available for high-volume shippers",
        "🚚 Multiple pickup locations can be configured"
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

      {/* Getting Started Guide */}
      <div className="border-t border-ui-border-base p-6 bg-ui-bg-subtle">
        <div className="mb-4">
          <Text className="font-medium text-ui-fg-base mb-2">🚀 Getting Started with Shipping Integration</Text>
          <Text className="text-sm text-ui-fg-muted mb-4">
            Each shipping provider requires you to create an account and obtain API credentials. 
            We've provided direct links and step-by-step guidance to make this process as smooth as possible.
          </Text>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-white rounded border">
            <Text className="font-medium text-blue-600 mb-1">1. Choose Provider</Text>
            <Text className="text-ui-fg-subtle">Select a shipping provider that operates in your market and meets your needs.</Text>
          </div>
          <div className="p-3 bg-white rounded border">
            <Text className="font-medium text-blue-600 mb-1">2. Get Credentials</Text>
            <Text className="text-ui-fg-subtle">Use our direct links to sign up and obtain your API keys from the provider's dashboard.</Text>
          </div>
          <div className="p-3 bg-white rounded border">
            <Text className="font-medium text-blue-600 mb-1">3. Configure & Test</Text>
            <Text className="text-ui-fg-subtle">Enter your credentials, test the connection, and start using competitive shipping rates.</Text>
          </div>
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
                  
                  {/* Quick link to provider signup */}
                  {status.status === 'not_configured' && provider.credentialLinks && (
                    <a
                      href={provider.credentialLinks.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"
                      title={`Sign up for ${provider.name}`}
                    >
                      🔗
                    </a>
                  )}
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
          {/* Quick Links Section */}
          {provider.credentialLinks && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <Text className="font-medium text-blue-900 mb-3">🔗 Quick Access Links</Text>
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={provider.credentialLinks.signupUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded text-sm text-blue-700 hover:bg-blue-100 border border-blue-300"
                >
                  📝 Sign Up Portal
                </a>
                <a 
                  href={provider.credentialLinks.dashboardUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded text-sm text-blue-700 hover:bg-blue-100 border border-blue-300"
                >
                  📊 Dashboard
                </a>
                <a 
                  href={provider.credentialLinks.apiDocsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded text-sm text-blue-700 hover:bg-blue-100 border border-blue-300"
                >
                  📚 API Documentation
                </a>
                <a 
                  href={provider.credentialLinks.supportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded text-sm text-blue-700 hover:bg-blue-100 border border-blue-300"
                >
                  🆘 Get Support
                </a>
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="mb-6 p-4 rounded-lg bg-ui-bg-subtle">
            <Text className="font-medium mb-3">📋 Setup Instructions</Text>
            <ol className="space-y-2">
              {provider.setupInstructions.map((instruction, index) => (
                <li key={index} className="text-sm text-ui-fg-muted flex items-start gap-2">
                  <span className="bg-ui-bg-base text-ui-fg-base rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Help Notes */}
          {provider.helpNotes && provider.helpNotes.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <Text className="font-medium text-green-900 mb-3">💡 Helpful Tips</Text>
              <div className="space-y-2">
                {provider.helpNotes.map((note, index) => (
                  <div key={index} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      <Form.Label className="flex items-center gap-2">
                        {config.description}
                        {config.required && <span className="text-red-500 ml-1">*</span>}
                      </Form.Label>
                      
                      {/* Where to find this credential */}
                      {config.credentialPath && (
                        <div className="mb-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                          <Text className="text-xs text-yellow-800">
                            📍 <strong>Find this at:</strong> {config.credentialPath}
                          </Text>
                        </div>
                      )}
                      
                      {/* Help text */}
                      {config.helpText && (
                        <div className="mb-2">
                          <Text className="text-xs text-ui-fg-subtle">
                            💡 {config.helpText}
                          </Text>
                        </div>
                      )}
                      
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
                        <Form.Hint>
                          Example: {config.example}
                        </Form.Hint>
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
