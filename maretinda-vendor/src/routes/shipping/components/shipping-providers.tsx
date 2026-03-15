import { Container, Heading, Text, Button, Badge, StatusBadge, Switch, toast } from "@medusajs/ui"
import { Plus, Pencil, CheckCircle, XCircle, TruckFast } from "@medusajs/icons"
import { useState } from "react"
import { useShippingProviders, useConfigureShippingProvider } from "../../../hooks/api/shipping"

export const ShippingProviders = () => {
  const { data, isLoading, isError } = useShippingProviders()
  const { mutateAsync: configureProvider, isPending } = useConfigureShippingProvider()
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text>Loading shipping providers...</Text>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error">Failed to load shipping providers</Text>
      </Container>
    )
  }

  const { providers, vendorConfig } = data

  const handleToggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      await configureProvider({
        action: enabled ? 'enable-provider' : 'disable-provider',
        providerId,
        data: {}
      })
      
      toast.success(`Provider ${enabled ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} provider`)
    }
  }

  const handleConfigureCredentials = (provider: any) => {
    setSelectedProvider(provider)
    setShowConfigModal(true)
  }

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'same_day': return 'bg-green-100 text-green-800'
      case 'express': return 'bg-blue-100 text-blue-800'
      case 'standard': return 'bg-gray-100 text-gray-800'
      case 'international': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <TruckFast className="h-5 w-5 text-ui-fg-subtle" />
          <Heading level="h2">Shipping Providers</Heading>
        </div>
        <Button size="small" variant="secondary">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className="border-t border-ui-border-base p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.providerId}
              className="rounded-lg border border-ui-border-base p-4 hover:border-ui-border-strong transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Text className="font-semibold">{provider.name}</Text>
                    <Badge size="2xsmall" className={getProviderTypeColor(provider.type)}>
                      {provider.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Text className="text-xs text-ui-fg-muted">
                    {provider.supportedMarkets.join(', ')}
                  </Text>
                </div>
                
                <Switch
                  checked={provider.isEnabled}
                  onCheckedChange={(enabled) => handleToggleProvider(provider.providerId, enabled)}
                  disabled={!provider.hasVendorCredentials && !provider.enabled}
                />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  {provider.hasVendorCredentials ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Text className="text-xs">
                    {provider.hasVendorCredentials ? 'Credentials Configured' : 'Needs Configuration'}
                  </Text>
                </div>
                
                {provider.isDefault && (
                  <div className="flex items-center gap-2">
                    <StatusBadge color="blue" size="small">Default</StatusBadge>
                  </div>
                )}
                
                {provider.credentialsLastUsed && (
                  <Text className="text-xs text-ui-fg-muted">
                    Last used: {new Date(provider.credentialsLastUsed).toLocaleDateString()}
                  </Text>
                )}
              </div>

              <div className="mb-4">
                <Text className="text-xs font-medium text-ui-fg-subtle mb-1">Capabilities:</Text>
                <div className="flex flex-wrap gap-1">
                  {provider.capabilities.slice(0, 3).map((capability) => (
                    <Badge key={capability} size="2xsmall" variant="neutral">
                      {capability}
                    </Badge>
                  ))}
                  {provider.capabilities.length > 3 && (
                    <Badge size="2xsmall" variant="neutral">
                      +{provider.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => handleConfigureCredentials(provider)}
                  className="flex-1"
                >
                  <Pencil className="h-3 w-3" />
                  {provider.hasVendorCredentials ? 'Update' : 'Configure'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12">
            <TruckFast className="h-12 w-12 text-ui-fg-muted mx-auto mb-4" />
            <Text className="text-ui-fg-subtle">No shipping providers available</Text>
            <Text className="text-xs text-ui-fg-muted mt-1">
              Contact support to enable shipping providers for your account
            </Text>
          </div>
        )}
      </div>

      {/* Configuration Summary */}
      <div className="border-t border-ui-border-base p-6">
        <Heading level="h3" className="mb-4">Configuration Summary</Heading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded border bg-ui-bg-subtle">
            <Text className="font-semibold text-sm">Enabled Providers</Text>
            <Text className="text-2xl font-bold text-ui-fg-base">
              {providers.filter(p => p.isEnabled).length}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              of {providers.length} available
            </Text>
          </div>
          
          <div className="p-3 rounded border bg-ui-bg-subtle">
            <Text className="font-semibold text-sm">Default Provider</Text>
            <Text className="text-lg font-bold text-ui-fg-base">
              {providers.find(p => p.isDefault)?.name || 'None'}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              Auto-selected for quotes
            </Text>
          </div>
          
          <div className="p-3 rounded border bg-ui-bg-subtle">
            <Text className="font-semibold text-sm">Billing Method</Text>
            <Text className="text-lg font-bold text-ui-fg-base">
              {vendorConfig.billingConfig.paymentMethod === 'marketplace' ? 'Marketplace' : 'Direct'}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              Payment responsibility
            </Text>
          </div>
        </div>
      </div>
    </Container>
  )
}
