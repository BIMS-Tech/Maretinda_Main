import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Hint, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import * as z from "zod"

import { Form } from "../../components/common/form"
import { useDashboardExtension } from "../../extensions"
import { useSignInWithEmailPass } from "../../hooks/api"
import { isFetchError } from "../../lib/is-fetch-error"

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
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full"
            style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo-m.png" alt="Maretinda" className="w-10 h-10 brightness-200" />
          <div>
            <span className="text-white text-2xl font-bold tracking-wide">Maretinda</span>
            <span
              className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.2)", color: "#c7d2fe" }}
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
          <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
            Manage your store, track orders, handle payments, and connect with customers — all from one dashboard.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: "🛍️", label: "List & manage your products" },
              { icon: "📊", label: "Track sales & analytics" },
              { icon: "💰", label: "Receive payouts & settlements" },
              { icon: "💬", label: "Chat with customers" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  {icon}
                </span>
                <span className="text-indigo-100 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} Maretinda. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <img src="/logo-m.png" alt="Maretinda" className="w-8 h-8" />
          <span className="text-xl font-bold" style={{ color: "#4338ca" }}>Maretinda</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: "#e0e7ff", color: "#4338ca" }}
          >
            Vendor
          </span>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#e0e7ff", color: "#4338ca" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Vendor Portal
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your vendor account to manage your store</p>
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
                        <Form.Label className="text-sm font-medium text-gray-700">
                          {t("fields.email")}
                        </Form.Label>
                        <Form.Control>
                          <Input
                            autoComplete="email"
                            {...field}
                            className="mt-1 !bg-white !text-gray-900 !border-gray-300 placeholder:!text-gray-400"
                            placeholder="vendor@example.com"
                          />
                        </Form.Control>
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label className="text-sm font-medium text-gray-700">
                          {t("fields.password")}
                        </Form.Label>
                        <Form.Control>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                            className="mt-1 !bg-white !text-gray-900 !border-gray-300 placeholder:!text-gray-400"
                            placeholder="••••••••"
                          />
                        </Form.Control>
                      </Form.Item>
                    )}
                  />
                </div>

                {validationError && (
                  <div className="text-center">
                    <Hint className="inline-flex" variant="error">
                      {validationError}
                    </Hint>
                  </div>
                )}
                {serverError && (
                  <Alert className="bg-ui-bg-base items-center p-2" dismissible variant="error">
                    {serverError}
                  </Alert>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  style={{ background: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)" }}
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
            <span className="text-gray-400 text-sm">
              <Trans
                i18nKey="login.forgotPassword"
                components={[
                  <Link
                    key="reset-password-link"
                    to="/reset-password"
                    className="font-medium transition-colors hover:opacity-80"
                    style={{ color: "#4338ca" }}
                  />,
                ]}
              />
            </span>

            {__DISABLE_SELLERS_REGISTRATION__ === "false" && (
              <span className="text-gray-400 text-sm">
                <Trans
                  i18nKey="login.notSellerYet"
                  components={[
                    <Link
                      key="register-link"
                      to="/register"
                      className="font-medium transition-colors hover:opacity-80"
                      style={{ color: "#4338ca" }}
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
