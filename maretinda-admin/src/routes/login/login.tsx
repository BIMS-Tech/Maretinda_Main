import { zodResolver } from "@hookform/resolvers/zod"
import { LockClosedSolid, Spinner } from "@medusajs/icons"
import { Alert, Hint, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import * as z from "zod"

import { AuthShell, Butterfly, GlassCard } from "../../components/auth/auth-shell"
import { Form } from "../../components/common/form"
import { useSignInWithEmailPass } from "../../hooks/api"
import { isFetchError } from "../../lib/is-fetch-error"
import { useExtension } from "../../providers/extension-provider"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const Login = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { getWidgets } = useExtension()

  const from = location.state?.from?.pathname || "/"

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const { mutateAsync, isPending } = useSignInWithEmailPass()

  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    await mutateAsync(
      { email, password },
      {
        onError: (error) => {
          if (isFetchError(error)) {
            if (error.status === 401) {
              form.setError("email", { type: "manual", message: error.message })
              return
            }
          }
          form.setError("root.serverError", { type: "manual", message: error.message })
        },
        onSuccess: () => {
          navigate(from, { replace: true })
        },
      }
    )
  })

  const serverError = form.formState.errors?.root?.serverError?.message
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message

  return (
    <AuthShell
      portal="Admin"
      headline={
        <>
          The whole marketplace,
          <br />
          <span className="italic text-[#FFC533]">at a glance.</span>
        </>
      }
      lede="Approve sellers, keep orders and couriers moving, settle payouts, and step in when a buyer or seller needs Maretinda."
      preview={<AdminPreview />}
    >
      <h2 className="font-display text-ui-fg-base text-[34px] leading-tight">Welcome back</h2>
      <p className="text-ui-fg-subtle mt-1 text-[15px]">Sign in to the Maretinda admin.</p>

      <div className="mt-8 flex flex-col gap-y-3">
        {getWidgets("login.before").map((Component, i) => (
          <Component key={i} />
        ))}

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-5" noValidate>
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label className="text-ui-fg-base text-sm font-medium">{t("fields.email")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="email" {...field} className="mt-1.5 h-11 text-[15px]" placeholder="you@maretinda.com" />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => (
                <Form.Item>
                  <div className="flex items-center justify-between">
                    <Form.Label className="text-ui-fg-base text-sm font-medium">{t("fields.password")}</Form.Label>
                    <Link to="/reset-password" className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-sm font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <Form.Control>
                    <Input type="password" autoComplete="current-password" {...field} className="mt-1.5 h-11 text-[15px]" placeholder="Your password" />
                  </Form.Control>
                </Form.Item>
              )}
            />

            {validationError && <Hint variant="error">{validationError}</Hint>}
            {serverError && (
              <Alert className="bg-ui-bg-base items-center p-2" dismissible variant="error">
                {serverError}
              </Alert>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="bg-ui-button-inverted hover:bg-ui-button-inverted-hover active:bg-ui-button-inverted-pressed shadow-buttons-inverted focus-visible:shadow-buttons-inverted-focus transition-fg mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Spinner className="animate-spin" />}
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </Form>

        {getWidgets("login.after").map((Component, i) => (
          <Component key={i} />
        ))}
      </div>

      <p className="text-ui-fg-muted mt-8 flex items-center gap-2 text-xs">
        <LockClosedSolid className="shrink-0" />
        For Maretinda staff. Sellers sign in at the Seller Centre.
      </p>
    </AuthShell>
  )
}

/** A glimpse of the admin: who can sell, and what's waiting. */
function AdminPreview() {
  return (
    <>
      <GlassCard className="absolute left-0 top-0 w-[260px]" tilt={-2}>
        <p className="text-xs text-white/60">Shops that can sell</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">
          128 <span className="text-sm font-normal text-white/55">of 164</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[78%] rounded-full bg-[#FFC533]" />
        </div>
      </GlassCard>
      <GlassCard className="absolute right-0 top-[92px] w-[270px]" tilt={2} delay={1400}>
        <p className="text-xs text-white/60">Waiting for you</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {[
            ["Seller applications", 3],
            ["Documents to verify", 2],
            ["Escalated returns", 1],
          ].map(([label, n]) => (
            <li key={label as string} className="flex items-center justify-between">
              <span className="text-white/85">{label}</span>
              <span className="rounded-full bg-[#FFC533]/20 px-2 text-xs font-medium text-[#FFD66E]">{n}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard className="absolute -top-5 right-4 flex items-center gap-2 !px-3 !py-2" tilt={1} delay={2800}>
        <Butterfly size={14} className="text-[#FFC533]" />
        <span className="text-xs">Sales, last 30 days · ₱1.24M</span>
      </GlassCard>
    </>
  )
}
