import { useState } from "react"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import {
  CheckCircle,
  XCircle,
  ExclamationCircle,
  EllipsisHorizontal,
  ArrowUpRightOnBox,
} from "@medusajs/icons"
import {
  useAdminShippingProviders,
  useAdminShippingProviderAction,
  PlatformProvider,
} from "../../hooks/api/shipping-providers"

// ─── Credential Form ──────────────────────────────────────────────────────────

function CredentialForm({
  provider,
  onSave,
  onTest,
  isSaving,
  isTesting,
}: {
  provider: PlatformProvider
  onSave: (creds: Record<string, unknown>) => void
  onTest: () => void
  isSaving: boolean
  isTesting: boolean
}) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const set = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }))
  const toggleShow = (key: string) => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-4 mt-4">
      {provider.credential_fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <Label size="small" weight="plus">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>

          {field.type === "select" && field.options ? (
            <Select value={String(values[field.key] ?? "")} onValueChange={(v) => set(field.key, v)}>
              <Select.Trigger>
                <Select.Value placeholder={`Select ${field.label}`} />
              </Select.Trigger>
              <Select.Content>
                {field.options.map((opt) => (
                  <Select.Item key={opt} value={opt}>{opt}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          ) : field.type === "boolean" ? (
            <div className="flex items-center gap-2">
              <Switch
                id={field.key}
                checked={Boolean(values[field.key])}
                onCheckedChange={(v) => set(field.key, v)}
              />
              <Label htmlFor={field.key} size="small">Enable sandbox mode (testing)</Label>
            </div>
          ) : (
            <div className="relative">
              <Input
                type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
                placeholder={field.help ?? field.label}
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
              {field.type === "password" && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ui-fg-muted text-xs"
                  onClick={() => toggleShow(field.key)}
                >
                  {showPasswords[field.key] ? "Hide" : "Show"}
                </button>
              )}
            </div>
          )}

          {field.help && field.type !== "boolean" && (
            <Text size="xsmall" className="text-ui-fg-subtle">{field.help}</Text>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <Button
          size="small"
          variant="primary"
          isLoading={isSaving}
          onClick={() => onSave(values)}
        >
          Save Credentials
        </Button>
        <Button
          size="small"
          variant="secondary"
          isLoading={isTesting}
          onClick={onTest}
        >
          Test Connection
        </Button>
      </div>
    </div>
  )
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: PlatformProvider }) {
  const [expanded, setExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const { mutateAsync } = useAdminShippingProviderAction()

  const handleSave = async (credentials: Record<string, unknown>) => {
    setIsSaving(true)
    try {
      const result = await mutateAsync({ action: "save-credentials", provider_id: provider.provider_id, credentials })
      toast.success(result.message)
      setExpanded(false)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save credentials")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    try {
      const result = await mutateAsync({ action: "test-credentials", provider_id: provider.provider_id })
      toast.success(result.message)
    } catch (err: any) {
      toast.error(err.message ?? "Connection test failed")
    } finally {
      setIsTesting(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      const action = provider.is_active ? "deactivate" : "activate"
      const result = await mutateAsync({ action, provider_id: provider.provider_id })
      toast.success(result.message)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update provider")
    }
  }

  const handleRemove = async () => {
    if (!window.confirm(`Remove credentials for ${provider.name}? This will disable this carrier for all sellers.`)) return
    try {
      const result = await mutateAsync({ action: "remove", provider_id: provider.provider_id })
      toast.success(result.message)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove provider")
    }
  }

  return (
    <Container className="p-0">
      <div className="flex items-start justify-between p-6">
        <div className="flex items-start gap-4 flex-1">
          {/* Status icon */}
          <div className="mt-0.5">
            {provider.is_active ? (
              <CheckCircle className="text-green-500 w-5 h-5" />
            ) : provider.is_configured ? (
              <ExclamationCircle className="text-amber-500 w-5 h-5" />
            ) : (
              <XCircle className="text-ui-fg-muted w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Heading level="h3">{provider.name}</Heading>
              {provider.is_active && (
                <Badge color="green" size="2xsmall">Active</Badge>
              )}
              {provider.is_configured && !provider.is_active && (
                <Badge color="orange" size="2xsmall">Configured · Not Active</Badge>
              )}
              {!provider.is_configured && (
                <Badge color="grey" size="2xsmall">Not configured</Badge>
              )}
              {provider.type === "standard" && provider.capabilities.includes("COD") && (
                <Badge color="blue" size="2xsmall">COD</Badge>
              )}
            </div>

            <Text size="small" className="text-ui-fg-subtle mt-1">
              Markets: {provider.markets.join(", ")} · {provider.capabilities.slice(0, 3).join(", ")}
              {provider.capabilities.length > 3 && ` +${provider.capabilities.length - 3} more`}
            </Text>

            {provider.is_configured && provider.last_updated && (
              <Text size="xsmall" className="text-ui-fg-muted mt-0.5">
                Last updated: {new Date(provider.last_updated).toLocaleDateString()}
              </Text>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={provider.dashboard_url}
            target="_blank"
            rel="noreferrer"
            className="text-ui-fg-muted hover:text-ui-fg-base"
            title="Open provider dashboard"
          >
            <ArrowUpRightOnBox className="w-4 h-4" />
          </a>

          {provider.is_configured && (
            <Switch
              checked={provider.is_active}
              onCheckedChange={handleToggleActive}
            />
          )}

          <Button
            size="small"
            variant="secondary"
            onClick={() => setExpanded(!expanded)}
          >
            {provider.is_configured ? "Update Credentials" : "Configure"}
          </Button>

          {provider.is_configured && (
            <Button size="small" variant="transparent" onClick={handleRemove}>
              <EllipsisHorizontal />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-6 pb-6">
          <Text size="small" className="text-ui-fg-subtle mt-4 mb-2">
            Enter Maretinda's platform-level credentials. These are shared by all sellers — vendors do not configure their own accounts.
          </Text>
          <CredentialForm
            provider={provider}
            onSave={handleSave}
            onTest={handleTest}
            isSaving={isSaving}
            isTesting={isTesting}
          />
        </div>
      )}
    </Container>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShippingProvidersPage() {
  const { providers, active_count, isLoading } = useAdminShippingProviders()

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Heading>Shipping Carriers</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage Maretinda's platform-level carrier accounts. Active carriers are available to all sellers automatically.
          </Text>
        </div>
        {active_count > 0 && (
          <Badge color="green">{active_count} active carrier{active_count > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {/* Info banner */}
      <Container className="bg-blue-500/10 border-blue-500/20 p-4">
        <div className="flex gap-3">
          <ExclamationCircle className="text-blue-500 w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <Text size="small" weight="plus" className="text-blue-600 dark:text-blue-400">
              Centralized Carrier Model
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle mt-0.5">
              Maretinda manages ONE account per carrier. Once you configure and activate a carrier here,
              all sellers on the platform can immediately book shipments through it — no per-vendor setup needed.
              Flying Tigers and Ninja Van are billed to Maretinda's account.
            </Text>
          </div>
        </div>
      </Container>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Text className="text-ui-fg-muted">Loading carriers...</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.provider_id} provider={provider} />
          ))}
        </div>
      )}

      {/* Webhook URLs */}
      <Container className="p-6">
        <Heading level="h3" className="mb-3">Webhook URLs</Heading>
        <Text size="small" className="text-ui-fg-subtle mb-4">
          Register these URLs in each carrier's merchant portal to receive real-time shipment status updates.
        </Text>
        <div className="flex flex-col gap-3">
          {[
            { carrier: "Ninja Van", path: "/store/webhooks/ninjavan", note: "Dashboard → Settings → Webhook" },
            { carrier: "Flying Tigers", path: "/store/webhooks/flyingtigers", note: "Portal → API Settings → Webhook URL" },
          ].map(({ carrier, path, note }) => (
            <div key={carrier} className="flex items-center justify-between p-3 rounded-lg bg-ui-bg-subtle">
              <div>
                <Text size="small" weight="plus">{carrier}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">{note}</Text>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-ui-bg-base px-2 py-1 rounded font-mono">
                  {window.location.origin.replace(":7001", ":9000")}{path}
                </code>
                <Button
                  size="small"
                  variant="transparent"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin.replace(":7001", ":9000") + path)
                    toast.success("Copied!")
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
