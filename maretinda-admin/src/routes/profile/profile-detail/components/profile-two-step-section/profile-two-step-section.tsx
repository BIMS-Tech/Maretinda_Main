import { Button, Container, Heading, Input, StatusBadge, Text, toast } from "@medusajs/ui"
import { useState } from "react"

import { mfaApi, useMfaStatus, useMyAccess } from "../../../../../hooks/api/admin-access"

/** Your role, and your two-step sign-in: how many recovery codes are left, and getting new ones. */
export const ProfileTwoStepSection = () => {
  const { data: access } = useMyAccess()
  const { data: mfa, refetch } = useMfaStatus()
  const [asking, setAsking] = useState(false)
  const [code, setCode] = useState("")
  const [codes, setCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)

  const renew = async () => {
    setBusy(true)
    try {
      const { recovery_codes } = await mfaApi.newRecoveryCodes(code)
      setCodes(recovery_codes)
      setAsking(false)
      setCode("")
      refetch()
    } catch (e: any) {
      toast.error(e?.message || "That code didn't work")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Access and sign-in</Heading>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">Your role</Text>
        <Text size="small">{access?.label ?? "—"}</Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">Two-step sign-in</Text>
        <div className="flex items-center gap-3">
          <StatusBadge color={mfa?.enabled ? "green" : "orange"}>{mfa?.enabled ? "On" : "Not set up"}</StatusBadge>
          {mfa?.enabled && (
            <Text size="xsmall" className="text-ui-fg-muted">
              {mfa.recovery_codes_left} recovery code{mfa.recovery_codes_left === 1 ? "" : "s"} left
            </Text>
          )}
        </div>
      </div>
      {mfa?.enabled && (
        <div className="flex flex-col gap-3 px-6 py-4">
          {codes ? (
            <>
              <Text size="small">Your new recovery codes. The old ones no longer work. Save these somewhere safe; they won't be shown again.</Text>
              <ul className="grid grid-cols-2 gap-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4 font-mono text-sm">
                {codes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button size="small" variant="secondary" onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}>
                  Copy
                </Button>
                <Button size="small" variant="secondary" onClick={() => setCodes(null)}>
                  Done
                </Button>
              </div>
            </>
          ) : asking ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Text size="small" className="mb-1">Enter the current code from your authenticator app</Text>
                <Input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <Button size="small" onClick={renew} isLoading={busy} disabled={code.length !== 6}>
                Get new codes
              </Button>
            </div>
          ) : (
            <div>
              <Button size="small" variant="secondary" onClick={() => setAsking(true)}>
                New recovery codes
              </Button>
            </div>
          )}
        </div>
      )}
    </Container>
  )
}
