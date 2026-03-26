'use client'

import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  toast,
  IconButton,
} from '@medusajs/ui'
import {
  CogSixTooth,
  CheckCircleSolid,
  XCircle,
  EllipsisHorizontal,
  Eye,
  EyeSlash,
} from '@medusajs/icons'
import { useState } from 'react'
import {
  useShippingProviders,
  useConfigureShippingProvider,
} from '../../../hooks/api/shipping'

// ── Provider icon component ──────────────────────────────────────────────────
function ProviderIcon({ providerId, size = 'md' }: { providerId: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-12 w-auto' : 'h-9 w-9'

  if (providerId === 'ninjavan') {
    return (
      <img
        src="/ninjavan-logo-mini.png"
        alt="Ninja Van"
        className={`${dim} object-contain`}
      />
    )
  }

  if (providerId === 'jnt') {
    return (
      <img
        src="/j&t-logo.jpeg"
        alt="J&T Express"
        className={`${dim} object-contain rounded`}
      />
    )
  }

  if (providerId === 'lalamove') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 215 215"
        className={dim}
        fill="#FF6600"
      >
        <path d="M187.53,28.07a.48.48,0,0,1,.32.82c-7,6.86-23.57,22.85-32.81,30-1.28,1-10,26.2-16.77,41.28-5.77,12.79-14.8,20.29-38.22,33.07-16.18,8.83-26.9,42.08-42.12,54.56a.46.46,0,0,1-.32.12.53.53,0,0,1-.49-.74l33.77-75.91c-3.53-.36-12.9-8.7-23.4-19.18a.24.24,0,0,1,.17-.41h.07l47.13,15.45h0a.07.07,0,0,0,.06-.11l-3.22-5.43a2,2,0,0,0-1.1-.88L60,84.13a1.82,1.82,0,0,1-.75-.48q-2.55-2.64-5.06-5.3a.13.13,0,0,1,.09-.22h0l53.82,17.65h0a.07.07,0,0,0,.06-.11l-3.32-5.6a1.46,1.46,0,0,0-.8-.64L47.93,71a3.51,3.51,0,0,1-1.52-1c-1.51-1.64-3-3.24-4.38-4.78a.16.16,0,0,1,.12-.26h.05l59.16,19.4h0a.07.07,0,0,0,.07-.11l-3.31-5.58a1.55,1.55,0,0,0-.85-.68L36.7,58.19l-1-.36a2.44,2.44,0,0,1-.95-.63c-3.42-3.8-5.55-6.21-6.62-7.43a.35.35,0,0,1,.26-.58l.12,0c10.39,3.43,83.55,27.58,89.27,29.4,0,0-9.44-28.28,33.51-28.28,1.35,0,26.27-15.92,36-22.18a.44.44,0,0,1,.26-.08" />
      </svg>
    )
  }

  return <span className="text-3xl">📦</span>
}

const TYPE_LABELS: Record<string, string> = {
  same_day: 'Same Day',
  express: 'Express',
  standard: 'Standard',
}

// ── Provider Status badge ────────────────────────────────────────────────────
function StatusChip({ provider }: { provider: any }) {
  if (!provider.hasVendorCredentials)
    return <span className="text-xs text-ui-fg-muted">Not configured</span>
  if (!provider.isEnabled)
    return <span className="text-xs text-ui-tag-orange-text font-medium">Saved – not enabled</span>
  if (provider.isDefault)
    return (
      <span className="flex items-center gap-1 text-xs text-ui-tag-blue-text font-medium">
        <CheckCircleSolid className="h-3.5 w-3.5" /> Default
      </span>
    )
  return (
    <span className="flex items-center gap-1 text-xs text-ui-tag-green-text font-medium">
      <CheckCircleSolid className="h-3.5 w-3.5" /> Enabled
    </span>
  )
}

// ── Field component used inside the credential form ──────────────────────────
function CredentialField({
  config,
  value,
  onChange,
}: {
  config: any
  value: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  const isSecret = config.type === 'password'

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-ui-fg-base">
        {config.description}
        {config.required && <span className="text-ui-fg-error ml-1">*</span>}
      </label>

      {config.credentialPath && (
        <p className="text-xs text-ui-fg-muted bg-ui-bg-subtle px-2 py-1 rounded">
          📍 {config.credentialPath}
        </p>
      )}

      <div className="relative flex items-center">
        {config.type === 'select' ? (
          <select
            className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select {config.description}</option>
            {(config.options ?? []).map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <Input
            className="w-full pr-10"
            type={isSecret && !show ? 'password' : 'text'}
            placeholder={`Enter ${config.description.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}

        {isSecret && (
          <button
            type="button"
            className="absolute right-2 text-ui-fg-muted hover:text-ui-fg-base"
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Provider Setup Drawer ────────────────────────────────────────────────────
function ProviderDrawer({
  provider,
  onClose,
  onSaved,
}: {
  provider: any
  onClose: () => void
  onSaved: () => void
}) {
  const configure = useConfigureShippingProvider()

  const buildInitial = () => {
    const init: Record<string, string> = {}
    Object.keys(provider.configTemplate ?? {}).forEach((k) => (init[k] = ''))
    return init
  }
  const [fields, setFields] = useState<Record<string, string>>(buildInitial)
  const [countryCode, setCountryCode] = useState(provider.supportedMarkets?.[0] ?? 'PH')
  const [sandbox, setSandbox] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')

  const set = (key: string, val: string) => setFields((p) => ({ ...p, [key]: val }))

  const handleSave = async () => {
    try {
      await configure.mutateAsync({
        action: 'save-credentials',
        providerId: provider.providerId,
        data: { credentials: { ...fields, sandbox }, country_code: countryCode },
      })
      toast.success('Credentials saved!')
      setStep('success')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save')
    }
  }

  const handleTest = async () => {
    try {
      await configure.mutateAsync({
        action: 'test-credentials',
        providerId: provider.providerId,
        data: {},
      })
      toast.success('Connection verified ✓')
    } catch (e: any) {
      toast.error(e?.message ?? 'Test failed')
    }
  }

  const handleEnable = async () => {
    try {
      await configure.mutateAsync({ action: 'enable', providerId: provider.providerId, data: {} })
      toast.success(`${provider.name} enabled!`)
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-ui-bg-base shadow-xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base sticky top-0 bg-ui-bg-base z-10">
          <div className="flex items-center gap-3">
            <ProviderIcon providerId={provider.providerId} />
            <div>
              <Heading level="h3">{provider.name}</Heading>
              <Text className="text-xs text-ui-fg-muted">
                {TYPE_LABELS[provider.type] ?? provider.type} · {provider.supportedMarkets?.join(', ')}
              </Text>
            </div>
          </div>
          <IconButton variant="transparent" onClick={onClose}>
            <XCircle />
          </IconButton>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {step === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircleSolid className="h-12 w-12 text-ui-tag-green-text" />
              <Heading level="h3">Credentials Saved!</Heading>
              <Text className="text-ui-fg-muted text-sm">
                You can now enable {provider.name} to start creating shipments.
              </Text>
              <Button variant="primary" className="w-full mt-2" onClick={handleEnable} isLoading={configure.isPending}>
                Enable {provider.name}
              </Button>
              <Button variant="transparent" className="w-full" onClick={onClose}>
                Do it later
              </Button>
            </div>
          ) : (
            <>
              {/* Step 1 – Get credentials */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ui-fg-base text-ui-bg-base text-xs font-bold">1</span>
                  <Text className="font-semibold text-ui-fg-base">Get your API credentials</Text>
                </div>

                {provider.setupInstructions?.length > 0 && (
                  <ol className="space-y-2 ml-8 mb-3">
                    {provider.setupInstructions.map((step: string, i: number) => (
                      <li key={i} className="text-sm text-ui-fg-muted flex gap-2">
                        <span className="text-ui-fg-subtle font-medium">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {provider.credentialLinks && (
                  <div className="ml-8 flex flex-wrap gap-2">
                    {provider.credentialLinks.signupUrl && (
                      <a
                        href={provider.credentialLinks.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ui-border-strong text-ui-fg-interactive text-xs hover:bg-ui-bg-subtle transition-colors"
                      >
                        📝 Create account
                      </a>
                    )}
                    {provider.credentialLinks.dashboardUrl && (
                      <a
                        href={provider.credentialLinks.dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ui-border-base text-ui-fg-base text-xs hover:bg-ui-bg-subtle transition-colors"
                      >
                        📊 Open Dashboard
                      </a>
                    )}
                    {provider.credentialLinks.apiDocsUrl && (
                      <a
                        href={provider.credentialLinks.apiDocsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ui-border-base text-ui-fg-base text-xs hover:bg-ui-bg-subtle transition-colors"
                      >
                        📚 API Docs
                      </a>
                    )}
                  </div>
                )}
              </section>

              <div className="border-t border-ui-border-base" />

              {/* Step 2 – Enter credentials */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ui-fg-base text-ui-bg-base text-xs font-bold">2</span>
                  <Text className="font-semibold text-ui-fg-base">Enter your credentials</Text>
                </div>

                <div className="ml-8 flex flex-col gap-4">
                  {/* Country selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-ui-fg-base">
                      Country <span className="text-ui-fg-error">*</span>
                    </label>
                    <select
                      className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {provider.supportedMarkets?.map((m: string) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Provider-specific fields */}
                  {Object.entries(provider.configTemplate ?? {}).map(([key, cfg]: [string, any]) => (
                    key !== 'country_code' && (
                      <CredentialField
                        key={key}
                        config={cfg}
                        value={fields[key] ?? ''}
                        onChange={(v) => set(key, v)}
                      />
                    )
                  ))}

                  {/* Sandbox toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${sandbox ? 'bg-ui-fg-interactive' : 'bg-ui-border-strong'}`}
                      onClick={() => setSandbox((v) => !v)}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-ui-bg-base shadow transition-transform ${sandbox ? 'translate-x-5' : ''}`}
                      />
                    </div>
                    <span className="text-sm text-ui-fg-base">Use Sandbox (testing mode)</span>
                  </label>
                  {sandbox && (
                    <p className="text-xs text-ui-tag-orange-text bg-ui-tag-orange-bg border border-ui-tag-orange-border rounded px-3 py-2">
                      ⚠️ Sandbox mode — orders won't be sent to real couriers. Switch off for live shipping.
                    </p>
                  )}
                </div>
              </section>

              <div className="border-t border-ui-border-base" />

              {/* Step 3 – Save */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ui-fg-base text-ui-bg-base text-xs font-bold">3</span>
                  <Text className="font-semibold text-ui-fg-base">Save &amp; verify</Text>
                </div>
                <div className="ml-8 flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSave}
                    isLoading={configure.isPending}
                  >
                    Save credentials
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleTest}
                    isLoading={configure.isPending}
                    disabled={!provider.hasVendorCredentials}
                    title={!provider.hasVendorCredentials ? 'Save credentials first' : undefined}
                  >
                    Test connection
                  </Button>
                </div>
                {!provider.hasVendorCredentials && (
                  <p className="ml-8 mt-2 text-xs text-ui-fg-muted">
                    Save your credentials first, then test the connection.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({
  provider,
  onOpen,
  onAction,
}: {
  provider: any
  onOpen: () => void
  onAction: (action: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-base p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProviderIcon providerId={provider.providerId} />
          <div>
            <Text className="font-semibold text-ui-fg-base">{provider.name}</Text>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge size="2xsmall" color="blue">{TYPE_LABELS[provider.type] ?? provider.type}</Badge>
            </div>
          </div>
        </div>
        <StatusChip provider={provider} />
      </div>

      {/* Markets */}
      <Text className="text-xs text-ui-fg-muted">
        🌏 {provider.supportedMarkets?.join(' · ')}
      </Text>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1">
        {provider.capabilities?.slice(0, 3).map((cap: string) => (
          <span key={cap} className="text-xs px-2 py-0.5 bg-ui-bg-subtle text-ui-fg-muted rounded-full">
            {cap}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-ui-border-base">
        <Button
          variant={provider.hasVendorCredentials ? 'secondary' : 'primary'}
          size="small"
          className="flex-1"
          onClick={onOpen}
        >
          {provider.hasVendorCredentials ? (
            <><CogSixTooth className="h-3.5 w-3.5 mr-1" /> Configure</>
          ) : (
            '+ Setup'
          )}
        </Button>

        {provider.hasVendorCredentials && (
          <div className="relative">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <EllipsisHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg z-20 py-1 text-sm">
                  {!provider.isEnabled && (
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-ui-bg-subtle text-ui-fg-base"
                      onClick={() => { onAction('enable'); setMenuOpen(false) }}
                    >
                      ✅ Enable
                    </button>
                  )}
                  {provider.isEnabled && (
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-ui-bg-subtle text-ui-fg-base"
                      onClick={() => { onAction('disable'); setMenuOpen(false) }}
                    >
                      ⏸ Disable
                    </button>
                  )}
                  {provider.isEnabled && !provider.isDefault && (
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-ui-bg-subtle text-ui-fg-base"
                      onClick={() => { onAction('set-default'); setMenuOpen(false) }}
                    >
                      ⭐ Set as default
                    </button>
                  )}
                  <div className="border-t border-ui-border-base my-1" />
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-ui-tag-red-bg text-ui-tag-red-text"
                    onClick={() => { onAction('remove'); setMenuOpen(false) }}
                  >
                    🗑 Remove credentials
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ShippingSetup component ─────────────────────────────────────────────
export const ShippingSetup = () => {
  const { data, isLoading, refetch } = useShippingProviders()
  const configure = useConfigureShippingProvider()
  const [openProvider, setOpenProvider] = useState<any>(null)

  const providers: any[] = data?.providers ?? []
  const configured = providers.filter((p) => p.hasVendorCredentials).length
  const enabled = providers.filter((p) => p.isEnabled).length

  const handleAction = async (action: string, providerId: string, name: string) => {
    try {
      await configure.mutateAsync({ action, providerId, data: {} })
      const messages: Record<string, string> = {
        enable: `${name} enabled`,
        disable: `${name} disabled`,
        'set-default': `${name} set as default`,
        remove: `${name} credentials removed`,
      }
      toast.success(messages[action] ?? 'Done')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Action failed')
    }
  }

  return (
    <Container className="p-0">
      {/* Header */}
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Heading level="h2">Shipping Providers</Heading>
          <Text className="text-ui-fg-muted text-sm mt-0.5">
            Connect your own courier accounts to create shipments directly from your orders.
          </Text>
        </div>

        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <p className="text-xl font-bold text-ui-fg-base">{configured}</p>
            <p className="text-xs text-ui-fg-muted">Configured</p>
          </div>
          <div className="text-center px-4 py-2 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <p className="text-xl font-bold text-ui-tag-green-text">{enabled}</p>
            <p className="text-xs text-ui-fg-muted">Enabled</p>
          </div>
        </div>
      </div>

      {/* How it works banner — only when nothing configured */}
      {configured === 0 && !isLoading && (
        <div className="mx-6 mb-5 rounded-xl bg-ui-tag-blue-bg border border-ui-tag-blue-border p-4">
          <Text className="font-semibold text-ui-fg-base mb-2">How it works</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Choose a provider', desc: 'Pick the courier that operates in your area.' },
              { step: '2', title: 'Get your API credentials', desc: 'Sign up with the courier and copy your API keys.' },
              { step: '3', title: 'Save & enable', desc: 'Paste the credentials here, test the connection, and enable.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ui-fg-base text-ui-bg-base text-xs font-bold">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium text-ui-fg-base">{item.title}</p>
                  <p className="text-xs text-ui-fg-subtle">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider grid */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-ui-border-base p-5 animate-pulse bg-ui-bg-subtle h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.providerId}
                provider={provider}
                onOpen={() => setOpenProvider(provider)}
                onAction={(action) => handleAction(action, provider.providerId, provider.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {openProvider && (
        <ProviderDrawer
          provider={openProvider}
          onClose={() => setOpenProvider(null)}
          onSaved={() => refetch()}
        />
      )}
    </Container>
  )
}
