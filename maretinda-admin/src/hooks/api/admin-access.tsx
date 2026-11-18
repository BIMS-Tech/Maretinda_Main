import { useMutation, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { usersQueryKeys } from "./users"

export type AdminRole = "owner" | "manager" | "finance" | "support" | "viewer"

export type MyAccess = {
  email: string | null
  role: AdminRole
  label: string
  areas: ("settings" | "finance" | "operations" | "support")[]
  mfa: { enabled: boolean; required: boolean }
}

export type AdminRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: AdminRole
  mfa_enabled: boolean
}

export type MfaStatus = { enabled: boolean; enabled_at: string | null; required: boolean; recovery_codes_left: number }

const ACCESS_KEY = ["admin-access"]

/** The signed-in admin's role and two-step status. */
export const useMyAccess = () =>
  useQuery({
    queryKey: [...ACCESS_KEY, "me"],
    queryFn: () => sdk.client.fetch<MyAccess>("/admin/admin-roles/me"),
    staleTime: 60_000,
  })

/** Every admin with their role (owners only). */
export const useAdminRoles = (enabled = true) =>
  useQuery({
    queryKey: [...ACCESS_KEY, "list"],
    queryFn: () =>
      sdk.client.fetch<{ roles: { value: AdminRole; label: string }[]; admins: AdminRow[]; invited: { email: string; role: AdminRole }[] }>(
        "/admin/admin-roles"
      ),
    enabled,
  })

export const useSetAdminRole = () =>
  useMutation({
    mutationFn: (body: { email: string; role: AdminRole }) =>
      sdk.client.fetch<{ email: string; role: AdminRole; label: string }>("/admin/admin-roles", { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCESS_KEY }),
  })

export const useResetAdminMfa = () =>
  useMutation({
    mutationFn: (userId: string) => sdk.client.fetch<{ reset: boolean }>("/admin/mfa/reset", { method: "POST", body: { user_id: userId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCESS_KEY }),
  })

export const useMfaStatus = () =>
  useQuery({ queryKey: [...ACCESS_KEY, "mfa"], queryFn: () => sdk.client.fetch<MfaStatus>("/admin/mfa"), retry: false })

/** After passing the second step, everything that was refused loads again. */
export const afterSecondStep = async () => {
  await queryClient.invalidateQueries({ queryKey: ACCESS_KEY })
  await queryClient.invalidateQueries({ queryKey: usersQueryKeys.me() })
}

export const mfaApi = {
  setup: () => sdk.client.fetch<{ secret: string; otpauth_url: string }>("/admin/mfa/setup", { method: "POST" }),
  enable: (code: string) =>
    sdk.client.fetch<{ enabled: boolean; recovery_codes: string[] }>("/admin/mfa/enable", { method: "POST", body: { code } }),
  verify: (code: string) =>
    sdk.client.fetch<{ verified: boolean; method: "totp" | "recovery"; recovery_codes_left: number }>("/admin/mfa/verify", {
      method: "POST",
      body: { code },
    }),
  newRecoveryCodes: (code: string) =>
    sdk.client.fetch<{ recovery_codes: string[] }>("/admin/mfa/recovery-codes", { method: "POST", body: { code } }),
}

/** The two refusals that mean "pass the second step first", as the API words them. */
export const isSecondStepError = (error: unknown) => {
  const e = error as { status?: number; message?: string } | null
  return e?.status === 403 && /two-step sign-in|authenticator app/i.test(e?.message ?? "")
}
