import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Hint, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"
import * as z from "zod"

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

  const from = location.state?.from?.pathname || "/orders"

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { mutateAsync, isPending } = useSignInWithEmailPass()

  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    await mutateAsync(
      { email, password },
      {
        onError: (error) => {
          if (isFetchError(error)) {
            if (error.status === 401) {
              form.setError("email", {
                type: "manual",
                message: error.message,
              })
              return
            }
          }
          form.setError("root.serverError", {
            type: "manual",
            message: error.message,
          })
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
    <div className="min-h-dvh w-dvw flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #2d1b69 0%, #4c1d95 40%, #6b21a8 100%)" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, #9333ea 0%, transparent 70%)" }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo-m.png" alt="Maretinda" className="w-10 h-10 brightness-200" />
          <span className="text-white text-2xl font-bold tracking-wide">Maretinda</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Manage your<br />
            marketplace<br />
            with ease
          </h1>
          <p className="text-purple-200 text-base leading-relaxed max-w-xs">
            Complete control over your orders, products, vendors, and settlements — all in one place.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: "📦", label: "Order & product management" },
              { icon: "🏪", label: "Vendor & seller oversight" },
              { icon: "💳", label: "Payments & settlements" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  {icon}
                </span>
                <span className="text-purple-100 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-purple-300 text-xs">© {new Date().getFullYear()} Maretinda. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <img src="/logo-m.png" alt="Maretinda" className="w-8 h-8" />
          <span className="text-xl font-bold" style={{ color: "#4c1d95" }}>Maretinda</span>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#f3e8ff", color: "#7c3aed" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Admin Portal
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your Maretinda admin account</p>
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
                            placeholder="admin@maretinda.com"
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
                  <Alert
                    className="bg-ui-bg-base items-center p-2"
                    dismissible
                    variant="error"
                  >
                    {serverError}
                  </Alert>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)" }}
                >
                  {isPending ? "Signing in…" : t("actions.continueWithEmail")}
                </button>
              </form>
            </Form>

            {getWidgets("login.after").map((Component, i) => (
              <Component key={i} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">
              <Trans
                i18nKey="login.forgotPassword"
                components={[
                  <Link
                    key="reset-password-link"
                    to="/reset-password"
                    className="font-medium transition-colors hover:opacity-80"
                    style={{ color: "#7c3aed" }}
                  />,
                ]}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
