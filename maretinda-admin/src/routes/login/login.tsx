import { zodResolver } from "@hookform/resolvers/zod"
import { LockClosedSolid } from "@medusajs/icons"
import { useState } from "react"
import { Alert, Hint, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import * as z from "zod"

import { AuthShell, Butterfly, GlassCard, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../../components/auth/auth-shell"
import { CountUp, GrowBar, MorphLabel, Shake } from "../../components/common/motion/motion"
import { Form } from "../../components/common/form"
import { useSignInWithEmailPass } from "../../hooks/api"
import { sdk } from "../../lib/client"
import { isFetchError } from "../../lib/is-fetch-error"
import { useExtension } from "../../providers/extension-provider"

/** Who a session token belongs to. The backend checks it on every call. */
const actorOf = (token: unknown): string => {
  try {
    const body = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(body)).actor_id ?? ""
  } catch {
    return ""
  }
}

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
  const [signedIn, setSignedIn] = useState(false)
  const [refused, setRefused] = useState(0)
  // The password was right, but it belongs to a seller or a shopper, not an admin
  const [notAdmin, setNotAdmin] = useState(false)

  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    await mutateAsync(
      { email, password },
      {
        onError: (error) => {
          setRefused((n) => n + 1)
          if (isFetchError(error)) {
            if (error.status === 401) {
              form.setError("email", { type: "manual", message: error.message })
              return
            }
          }
          form.setError("root.serverError", { type: "manual", message: error.message })
        },
        onSuccess: async (token) => {
          // A password is checked whatever the account; one that opens no admin
          // would be bounced back here without a word
          if (typeof token === "string" && !actorOf(token)) {
            await sdk.auth.logout().catch(() => undefined)
            window.localStorage.removeItem("medusa_admin_jwt")
            setNotAdmin(true)
            return
          }
          setSignedIn(true)
          setTimeout(() => navigate(from, { replace: true }), 450)
        },
      }
    // Shown on the form already: nothing more to do with it here
    ).catch(() => undefined)
  })

  const serverError = form.formState.errors?.root?.serverError?.message
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message

  return (
    <AuthShell
      admin
      portal="Admin"
      lines={["The whole marketplace,", "at a glance."]}
      lede="Approve sellers, keep orders and couriers moving, settle payouts, and step in when a buyer or seller needs Maretinda."
      preview={<AdminPreview />}
    >
      {notAdmin ? (
        <div className="brand-rise flex flex-col gap-4" role="alert" data-testid="not-admin">
          <h2 className="font-display text-ui-fg-base text-[30px] leading-tight">This sign-in isn&apos;t an admin&apos;s</h2>
          <p className="text-ui-fg-subtle text-[15px] leading-relaxed">
            The email and password are right, but they belong to a seller or a shopper, and open nothing here. Sellers sign in at
            the Seller Centre, and shoppers on the storefront.
          </p>
          <div className="mt-2 flex flex-col gap-2.5">
            {__STOREFRONT_URL__ && (
              <a href={__STOREFRONT_URL__} className={PRIMARY_BUTTON}>
                Go to the storefront
              </a>
            )}
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={() => {
                setNotAdmin(false)
                form.reset({ email: "", password: "" })
              }}
            >
              Use a different account
            </button>
          </div>
        </div>
      ) : (
        <>
      <h2 className="font-display text-ui-fg-base text-[34px] leading-tight">Welcome back</h2>
      <p className="text-ui-fg-subtle mt-1 text-[15px]">Sign in to the Maretinda admin.</p>

      <div className="mt-8 flex flex-col gap-y-3">
        {getWidgets("login.before").map((Component, i) => (
          <Component key={i} />
        ))}

        <Form {...form}>
          <Shake again={refused}>
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
              disabled={isPending || signedIn}
              className={`${PRIMARY_BUTTON} mt-1 overflow-hidden ${signedIn ? "!bg-ui-tag-green-icon" : ""}`}
            >
              <MorphLabel state={signedIn ? "done" : isPending ? "busy" : "idle"} idle="Sign in" busy="Signing in…" done="Welcome back" />
            </button>
          </form>
          </Shake>
        </Form>

        {getWidgets("login.after").map((Component, i) => (
          <Component key={i} />
        ))}
      </div>

        </>
      )}

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
        <p className="text-xs opacity-60">Shops that can sell</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">
          <CountUp value={128} /> <span className="text-sm font-normal opacity-55">of 164</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#432C63]/10 dark:bg-white/10">
          <GrowBar share={0.78} className="bg-[#FFC533]" delay={0.3} />
        </div>
      </GlassCard>
      <GlassCard className="absolute right-0 top-[92px] w-[270px]" tilt={2} delay={1400}>
        <p className="text-xs opacity-60">Waiting for you</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm">
          {[
            ["Seller applications", 3],
            ["Documents to verify", 2],
            ["Escalated returns", 1],
          ].map(([label, n]) => (
            <li key={label as string} className="flex items-center justify-between">
              <span className="opacity-90">{label}</span>
              <span className="rounded-full bg-[#FFC533]/20 px-2 text-xs font-medium text-[#7A5600] dark:text-[#FFD66E]">{n}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard className="absolute -top-5 right-4 flex items-center gap-2 !px-3 !py-2" tilt={1} delay={2800}>
        <Butterfly size={14} className="text-[#6B4C9A] dark:text-[#FFC533]" />
        <span className="text-xs">Sales, last 30 days · ₱1.24M</span>
      </GlassCard>
    </>
  )
}
