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
    <div className="min-h-dvh w-dvw flex">

      {/* Left panel — admin dark theme */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        {/* Subtle accent circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-[0.07]" style={{ backgroundColor: "#432C63" }} />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-[0.07]" style={{ backgroundColor: "#432C63" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <MaretindaFlower color="white" size={40} />
          <div>
            <span className="text-white text-2xl font-bold tracking-wide">Maretinda</span>
            <span
              className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#432C63", color: "white" }}
            >
              Admin
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Manage your<br />
            marketplace<br />
            with ease
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-xs">
            Complete control over orders, products, vendors, and settlements — all in one place.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              "Order & product management",
              "Vendor & seller oversight",
              "Payments & settlements",
              "Platform analytics",
            ].map(label => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#432C63" }}
                >
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-white/60 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Maretinda. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — clean white */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <MaretindaFlower color="#432C63" size={28} />
          <span className="text-xl font-bold text-gray-900">Maretinda</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#1A1A1A", color: "white" }}>Admin</span>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ backgroundColor: "#1A1A1A", color: "white" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
                  style={{ backgroundColor: "#1A1A1A" }}
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
                    style={{ color: "#432C63" }}
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
