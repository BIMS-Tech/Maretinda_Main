import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Hint, Input } from "@medusajs/ui"
import { CircleHalfSolid, Moon, Sun } from "@medusajs/icons"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import * as z from "zod"

import { Form } from "../../components/common/form"
import { useDashboardExtension } from "../../extensions"
import { useSignInWithEmailPass } from "../../hooks/api"
import { isFetchError } from "../../lib/is-fetch-error"
import { useTheme } from "../../providers/theme-provider"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function MaretindaFlower({ color = "white", size = 44 }: { color?: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size}>
      {[45, 135, 225, 315].map(angle => (
        <path
          key={angle}
          d="M16,17 C12.5,14 11,7.5 16,5 C21,7.5 19.5,14 16,17Z"
          fill={color}
          transform={`rotate(${angle},16,16)`}
        />
      ))}
    </svg>
  )
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()
  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${theme}`}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base transition-colors"
    >
      {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "light" ? <Sun className="w-4 h-4" /> : <CircleHalfSolid className="w-4 h-4" />}
    </button>
  )
}

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
          setTimeout(() => navigate(from, { replace: true }), 1000)
        },
      }
    )
  })

  const meaningfulReason = reason && !reason.toLowerCase().includes("failed to fetch") ? reason : ""
  const serverError = form.formState.errors?.root?.serverError?.message || meaningfulReason
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message

  return (
    <div className="min-h-dvh w-dvw flex">

      {/* Left panel — vendor brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ backgroundColor: "#432C63" }}
      >
        {/* Subtle background texture */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#ffffff" }} />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#ffffff" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <MaretindaFlower color="white" size={40} />
          <div>
            <span className="text-white text-2xl font-bold tracking-wide">Maretinda</span>
            <span
              className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}
            >
              Vendor
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Grow your<br />
            business with<br />
            Maretinda
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Manage your store, track orders, handle payments, and connect with customers — all from one dashboard.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              "List & manage your products",
              "Track sales & analytics",
              "Receive payouts & settlements",
              "Chat directly with customers",
            ].map(label => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 text-white/90"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-white/80 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Maretinda. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col bg-ui-bg-base px-6 py-12">
        {/* Mobile logo + theme toggle */}
        <div className="flex items-center justify-between mb-8 lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
            <MaretindaFlower color="#432C63" size={28} />
            <span className="text-xl font-bold" style={{ color: "#432C63" }}>Maretinda</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F2ECF8", color: "#432C63" }}>
              Vendor
            </span>
          </div>
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-[360px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#F2ECF8", color: "#432C63" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Vendor Portal
            </div>
            <h2 className="text-2xl font-bold text-ui-fg-base mb-1">Welcome back</h2>
            <p className="text-ui-fg-subtle text-sm">Sign in to your vendor account to manage your store</p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-y-3">
            {getWidgets("login.before").map((Component, i) => (
              <Component key={i} />
            ))}

            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-3">
                  <Form.Field
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label className="text-sm font-medium text-ui-fg-base">
                          {t("fields.email")}
                        </Form.Label>
                        <Form.Control>
                          <Input autoComplete="email" {...field} className="mt-1" placeholder="vendor@example.com" />
                        </Form.Control>
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label className="text-sm font-medium text-ui-fg-base">
                          {t("fields.password")}
                        </Form.Label>
                        <Form.Control>
                          <Input type="password" autoComplete="current-password" {...field} className="mt-1" placeholder="••••••••" />
                        </Form.Control>
                      </Form.Item>
                    )}
                  />
                </div>

                {validationError && (
                  <div className="text-center">
                    <Hint className="inline-flex" variant="error">{validationError}</Hint>
                  </div>
                )}
                {serverError && (
                  <Alert className="bg-ui-bg-base items-center p-2" dismissible variant="error">{serverError}</Alert>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1 hover:opacity-90"
                  style={{ backgroundColor: "#432C63" }}
                >
                  {isPending ? "Signing in…" : "Sign In"}
                </button>
              </form>
            </Form>

            {getWidgets("login.after").map((Component, i) => (
              <Component key={i} />
            ))}
          </div>

          <div className="mt-5 flex flex-col items-center gap-2">
            <span className="text-ui-fg-subtle text-sm">
              <Trans
                i18nKey="login.forgotPassword"
                components={[
                  <Link
                    key="reset-password-link"
                    to="/reset-password"
                    className="font-medium transition-colors hover:opacity-80"
                    style={{ color: "#432C63" }}
                  />,
                ]}
              />
            </span>

            {__DISABLE_SELLERS_REGISTRATION__ === "false" && (
              <span className="text-ui-fg-subtle text-sm">
                <Trans
                  i18nKey="login.notSellerYet"
                  components={[
                    <Link
                      key="register-link"
                      to="/register"
                      className="font-medium transition-colors hover:opacity-80"
                      style={{ color: "#432C63" }}
                    />,
                  ]}
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
