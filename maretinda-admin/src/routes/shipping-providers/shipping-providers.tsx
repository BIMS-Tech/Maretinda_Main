import { useState } from "react"
import { Link } from "react-router-dom"
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
  ArrowUpRightOnBox,
  ArrowRightMini,
  Eye,
  EyeSlash,
  Trash,
} from "@medusajs/icons"
import {
  useAdminShippingProviders,
  useAdminShippingProviderAction,
  PlatformProvider,
  ShippingChecklist,
} from "../../hooks/api/shipping-providers"
import { backendUrl } from "../../lib/client/client"

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
            {field.required && <span className="text-ui-fg-error ml-0.5">*</span>}
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
                className={field.type === "password" ? "pr-9" : undefined}
                placeholder={field.help ?? field.label}
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
              {field.type === "password" && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ui-fg-muted hover:text-ui-fg-base"
                  onClick={() => toggleShow(field.key)}
                  aria-label={showPasswords[field.key] ? "Hide value" : "Show value"}
                  title={showPasswords[field.key] ? "Hide" : "Show"}
                >
                  {showPasswords[field.key] ? (
                    <EyeSlash className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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

// ─── Shipment updates (Flying Tigers webhook) ─────────────────────────────────

const FLYING_TIGERS_WEBHOOK_URL = `${backendUrl.replace(/\/$/, "")}/webhooks/flyingtigers`

/**
 * Flying Tigers pushes pickup and delivery updates to our webhook. Registering
 * it from here tells Flying Tigers the URL and stores the signing secret it
 * returns, so there's nothing to copy into its portal or the server.
 */
function WebhookStatus({ provider }: { provider: PlatformProvider }) {
  const { mutateAsync, isPending } = useAdminShippingProviderAction()
  const register = async () => {
    try {
      const result = await mutateAsync({
        action: "register-webhook",
        provider_id: provider.provider_id,
        webhook_url: FLYING_TIGERS_WEBHOOK_URL,
      })
      toast.success(result.message)
    } catch (err: any) {
      toast.error(err.message ?? "Failed to register the webhook")
    }
  }
  const registeredHere = provider.webhook?.url === FLYING_TIGERS_WEBHOOK_URL

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-ui-bg-subtle px-3 py-2">
      {provider.webhook_ready && registeredHere ? (
        <CheckCircle className="text-ui-tag-green-icon w-4 h-4" />
      ) : (
        <ExclamationCircle className="text-ui-tag-orange-icon w-4 h-4" />
      )}
      <Text size="xsmall" className="text-ui-fg-subtle flex-1">
        {provider.webhook_ready && registeredHere
          ? `Shipment updates connected (${provider.webhook!.mode}) since ${new Date(provider.webhook!.registered_at).toLocaleDateString()}`
          : provider.webhook
            ? "Shipment updates go to a different server. Register this one to receive them here."
            : "Shipment updates aren't connected: bookings stay at pending pickup until Flying Tigers can notify us."}
      </Text>
      <Button size="small" variant="secondary" isLoading={isPending} onClick={register}>
        {provider.webhook ? "Register again" : "Connect shipment updates"}
      </Button>
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
              <CheckCircle className="text-ui-tag-green-icon w-5 h-5" />
            ) : provider.is_configured ? (
              <ExclamationCircle className="text-ui-tag-orange-icon w-5 h-5" />
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
              {provider.mode === "sandbox" && (
                <Badge color="orange" size="2xsmall">Sandbox keys</Badge>
              )}
              {provider.mode === "live" && (
                <Badge color="purple" size="2xsmall">Live keys</Badge>
              )}
              {provider.type === "standard" && provider.capabilities.includes("COD") && (
                <Badge color="grey" size="2xsmall">COD</Badge>
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
            {provider.mode === "sandbox" && (
              <Text size="xsmall" className="text-ui-tag-orange-text mt-1">
                Bookings made with sandbox keys are tests: they get a tracking number but no rider is sent.
              </Text>
            )}
            {provider.provider_id === "flyingtigers" && provider.is_configured && (
              <WebhookStatus provider={provider} />
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
            <Button
              size="small"
              variant="secondary"
              onClick={handleRemove}
              className="text-ui-fg-error"
              title="Remove this carrier's credentials"
            >
              <Trash className="w-4 h-4" />
              Remove
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

          {provider.is_configured && (
            <div className="mt-5 pt-4 border-t border-ui-border-base flex items-center justify-between gap-3">
              <Text size="xsmall" className="text-ui-fg-subtle">
                <span className="text-ui-fg-error font-medium">Remove credentials</span> — deletes
                this carrier's stored keys and disables it for all sellers. You can re-add
                credentials anytime.
              </Text>
              <Button
                size="small"
                variant="secondary"
                onClick={handleRemove}
                className="text-ui-fg-error flex-shrink-0"
              >
                <Trash className="w-4 h-4" />
                Remove
              </Button>
            </div>
          )}
        </div>
      )}
    </Container>
  )
}

// ─── Setup Checklist ──────────────────────────────────────────────────────────

function SetupChecklist({
  activeCount,
  checklist,
  providers,
}: {
  activeCount: number
  checklist: ShippingChecklist | null
  providers: PlatformProvider[]
}) {
  const flyingTigers = providers.find((p) => p.provider_id === "flyingtigers" && p.is_active)
  const items = [
    {
      done: activeCount > 0,
      label: "Activate at least one carrier",
      detail: "Save a carrier's credentials below and switch it on",
    },
    ...(flyingTigers
      ? [
          {
            done: !!flyingTigers.webhook_ready,
            label: "Connect Flying Tigers shipment updates",
            detail: "So bookings move to picked up and delivered on their own",
          },
        ]
      : []),
    {
      done: checklist?.ph_region,
      label: "A region includes the Philippines",
      detail: "Sellers need it to offer shipping at checkout",
      link: "/settings/regions",
    },
    {
      done: checklist ? checklist.sellers_with_shipping > 0 : undefined,
      label: "Sellers can ship",
      detail: checklist
        ? `${checklist.sellers_with_shipping} of ${checklist.sellers_total} sellers have a warehouse with a shipping option. Each seller sets this up in their own panel.`
        : "Each seller sets up a warehouse, a zone and shipping options in their own panel",
    },
  ]

  return (
    <Container className="p-5">
      <Heading level="h3" className="mb-3">Platform Setup Checklist</Heading>
      <div className="flex flex-col gap-3">
        {items.map(({ done, label, detail, link }: any) => (
          <div key={label} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {done === true ? (
                <CheckCircle className="text-ui-tag-green-icon w-4 h-4" />
              ) : done === false ? (
                <XCircle className="text-ui-fg-muted w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-ui-border-base" />
              )}
            </div>
            <div>
              <Text size="small" weight="plus">{label}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">{detail}</Text>
              {link && !done && (
                <Link
                  to={link}
                  className="inline-flex items-center gap-1 mt-1 text-xs text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                >
                  Open <ArrowRightMini className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShippingProvidersPage() {
  const { providers, active_count, checklist, isLoading } = useAdminShippingProviders()

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
      <Container className="bg-ui-bg-highlight p-4">
        <div className="flex gap-3">
          <ExclamationCircle className="text-ui-fg-interactive w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-interactive">
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

      <SetupChecklist activeCount={active_count} checklist={checklist} providers={providers} />

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
          Where each carrier sends shipment status updates. Ninja Van's is entered in its dashboard.
        </Text>
        <div className="flex flex-col gap-3">
          {[
            { carrier: "Ninja Van", path: "/webhooks/ninjavan", note: "Dashboard → Settings → Webhook" },
            { carrier: "Flying Tigers", path: "/webhooks/flyingtigers", note: "Connected from the Flying Tigers card above" },
          ].map(({ carrier, path, note }) => {
            const fullUrl = `${backendUrl.replace(/\/$/, "")}${path}`
            return (
              <div key={carrier} className="flex items-center justify-between p-3 rounded-lg bg-ui-bg-subtle">
                <div>
                  <Text size="small" weight="plus">{carrier}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">{note}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-ui-bg-base px-2 py-1 rounded font-mono">
                    {fullUrl}
                  </code>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => {
                      navigator.clipboard.writeText(fullUrl)
                      toast.success("Copied!")
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
