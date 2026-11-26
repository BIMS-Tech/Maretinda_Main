import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Hint, Input } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import * as z from "zod"

import { Form } from "../../components/common/form"
import { useDashboardExtension } from "../../extensions"
import { useSignInWithEmailPass } from "../../hooks/api"
import { isFetchError } from "../../lib/is-fetch-error"
import { AuthShell, Butterfly, GlassCard, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../../components/auth/auth-shell"
import { CountUp, MorphLabel, Shake, Sparkline } from "../../components/common/motion/motion"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const reason = searchParams.get("reason") || ""
  const { getWidgets } = useDashboardExtension()
  const from = "/dashboard"

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const { mutateAsync, isPending } = useSignInWithEmailPass()
  const [signedIn, setSignedIn] = useState(false)
  const [refused, setRefused] = useState(0)

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
        onSuccess: () => {
          setSignedIn(true)
          setTimeout(() => navigate(from, { replace: true }), 700)
        },
      }
    // Shown on the form already: nothing more to do with it here
    ).catch(() => undefined)
  })

  const meaningfulReason = reason && !reason.toLowerCase().includes("failed to fetch") ? reason : ""
  const serverError = form.formState.errors?.root?.serverError?.message || meaningfulReason
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message

  return (
    <AuthShell
      portal="Seller Centre"
      lines={["Your shop, open to", "the whole Philippines."]}
      lede="List your products, take orders and get paid, with buyers from Luzon to Mindanao finding you on Maretinda."
      preview={<SellerPreview />}
    >
      <h2 className="font-display text-ui-fg-base text-[34px] leading-tight">Welcome back</h2>
      <p className="text-ui-fg-subtle mt-1 text-[15px]">Sign in to run your shop.</p>

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
                    <Input autoComplete="email" {...field} className="mt-1.5 h-11 text-[15px]" placeholder="you@yourshop.ph" />
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

      {__DISABLE_SELLERS_REGISTRATION__ === "false" && (
        <>
          <div className="text-ui-fg-muted my-7 flex items-center gap-3 text-xs">
            <span className="bg-ui-border-base h-px flex-1" />
            New to Maretinda?
            <span className="bg-ui-border-base h-px flex-1" />
          </div>
          <Link
            to="/register"
            className={SECONDARY_BUTTON}
          >
            Open a shop
          </Link>
        </>
      )}
    </AuthShell>
  )
}

/** A glimpse of the panel: the day's sales, a new order, a payout. */
function SellerPreview() {
  return (
    <>
      <GlassCard className="absolute left-0 top-0 w-[260px]" tilt={-2}>
        <p className="text-xs opacity-60">Today's sales</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">
          <CountUp value={12480} format={(n) => `₱${Math.round(n).toLocaleString("en-PH")}`} />
        </p>
        <div className="mt-1 flex items-end justify-between">
          <span className="rounded-full bg-ui-tag-green-bg px-2 py-0.5 text-[11px] font-medium text-ui-tag-green-text">+18% vs yesterday</span>
          <Sparkline points={[6, 10, 8, 17, 15, 23, 21, 29]} className="text-[#FFC533]" />
        </div>
      </GlassCard>
      <GlassCard className="absolute right-0 top-[96px] w-[280px]" tilt={2} delay={1400}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFC533] text-[#432C63]">
            <Butterfly size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap text-sm font-medium">New order #1042</p>
            <p className="truncate text-xs opacity-60">Barong · Cebu City</p>
          </div>
          <span className="text-sm font-semibold">₱2,450</span>
        </div>
      </GlassCard>
      <GlassCard className="absolute bottom-0 left-8 flex items-center gap-2 !px-3 !py-2" tilt={-1} delay={2800}>
        <CheckCircleSolid className="text-ui-tag-green-icon" />
        <span className="text-xs">Payout sent · ₱8,215</span>
      </GlassCard>
    </>
  )
}
