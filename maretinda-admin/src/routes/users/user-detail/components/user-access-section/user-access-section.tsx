import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Select, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui"

import { AdminRole, useAdminRoles, useMyAccess, useResetAdminMfa, useSetAdminRole } from "../../../../../hooks/api/admin-access"
import { ROLE_OPTIONS } from "../../../common/role-options"

/**
 * What this admin may change, and their two-step sign-in. Owners can change the
 * role and reset two-step sign-in (a lost phone); everyone else sees it read-only.
 */
export const UserAccessSection = ({ user }: { user: HttpTypes.AdminUser }) => {
  const prompt = usePrompt()
  const { data: me } = useMyAccess()
  const isOwner = me?.role === "owner"
  const { data, isPending } = useAdminRoles(isOwner)
  const setRole = useSetAdminRole()
  const resetMfa = useResetAdminMfa()

  const row = data?.admins.find((a) => a.id === user.id)
  const role = row?.role
  const option = ROLE_OPTIONS.find((o) => o.value === role)

  const changeRole = async (value: string) => {
    try {
      await setRole.mutateAsync({ email: user.email, role: value as AdminRole })
      toast.success(`${user.email} is now ${ROLE_OPTIONS.find((o) => o.value === value)?.label}.`)
    } catch (e: any) {
      toast.error(e?.message || "Could not change the role")
    }
  }

  const reset = async () => {
    const ok = await prompt({
      title: "Reset two-step sign-in?",
      description: `${user.email} will have to set up their authenticator app again the next time they sign in. Do this only if you've confirmed it's really them.`,
      confirmText: "Reset",
      cancelText: "Cancel",
    })
    if (!ok) return
    try {
      await resetMfa.mutateAsync(user.id)
      toast.success("Two-step sign-in reset. They'll set it up again at their next sign-in.")
    } catch (e: any) {
      toast.error(e?.message || "Could not reset two-step sign-in")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Access</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {isOwner ? "What this admin may change, and their two-step sign-in." : "Only owners can change roles."}
        </Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">Role</Text>
        {isOwner ? (
          <div className="flex flex-col gap-1">
            <Select value={role} onValueChange={changeRole} disabled={isPending || setRole.isPending}>
              <Select.Trigger>
                <Select.Value placeholder="Loading…" />
              </Select.Trigger>
              <Select.Content>
                {ROLE_OPTIONS.map((o) => (
                  <Select.Item key={o.value} value={o.value}>
                    {o.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            {option && <Text size="xsmall" className="text-ui-fg-muted">{option.hint}</Text>}
          </div>
        ) : (
          <Text size="small">{me?.email === user.email.toLowerCase() ? me?.label : "—"}</Text>
        )}
      </div>
      {isOwner && (
        <div className="grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" weight="plus" className="text-ui-fg-subtle">Two-step sign-in</Text>
          <div className="flex items-center gap-3">
            <StatusBadge color={row?.mfa_enabled ? "green" : "orange"}>{row?.mfa_enabled ? "On" : "Not set up"}</StatusBadge>
            {row?.mfa_enabled && (
              <Button size="small" variant="secondary" onClick={reset} isLoading={resetMfa.isPending}>
                Reset
              </Button>
            )}
          </div>
        </div>
      )}
    </Container>
  )
}
