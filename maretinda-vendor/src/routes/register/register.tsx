import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Hint, Input } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import * as z from "zod"

import { Form } from "../../components/common/form"
import { useSignUpWithEmailPass } from "../../hooks/api"
import { isFetchError } from "../../lib/is-fetch-error"

const RegisterSchema = z.object({
  name: z.string().min(2, { message: "Name should be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(2, { message: "Password is required" }),
  confirmPassword: z.string().min(2, { message: "Please confirm your password" }),
})

export const Register = () => {
  const [success, setSuccess] = useState(false)
  const { t } = useTranslation()

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  const { mutateAsync, isPending } = useSignUpWithEmailPass()

  const handleSubmit = form.handleSubmit(async ({ name, email, password, confirmPassword }) => {
    if (password !== confirmPassword) {
      form.setError("password", { type: "manual", message: "Passwords do not match" })
      form.setError("confirmPassword", { type: "manual", message: "Passwords do not match" })
      return null
    }

    await mutateAsync(
      { name, email, password, confirmPassword },
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
        onSuccess: () => setSuccess(true),
      }
    )
  })

  const serverError = form.formState.errors?.root?.serverError?.message
  const validationError =
    form.formState.errors.name?.message ||
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.confirmPassword?.message

  if (success) {
    return (
      <div className="min-h-dvh w-dvw flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-[400px] text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#e0e7ff" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration submitted!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Thank you for registering as a vendor. You may need to wait for admin approval before you can log in. A confirmation email will be sent to you shortly.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)" }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

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
            Start selling<br />
            on Maretinda<br />
            today
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
            Join our growing marketplace and reach thousands of customers. Set up your store in minutes.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: "✅", label: "Free to register & get started" },
              { icon: "🚀", label: "Quick onboarding process" },
              { icon: "🌍", label: "Reach customers nationwide" },
              { icon: "💰", label: "Fast & secure payouts" },
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

      {/* Right panel — register form */}
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

        <div className="w-full max-w-[380px]">
          {/* Header */}
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#e0e7ff", color: "#4338ca" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Vendor Registration
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your store</h2>
            <p className="text-gray-500 text-sm">Register as a vendor to start selling on Maretinda</p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
              <div className="flex flex-col gap-y-3">
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label className="text-sm font-medium text-gray-700">Store / Company Name</Form.Label>
                      <Form.Control>
                        <Input {...field} className="mt-1" placeholder="e.g. My Awesome Store" />
                      </Form.Control>
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label className="text-sm font-medium text-gray-700">{t("fields.email")}</Form.Label>
                      <Form.Control>
                        <Input {...field} className="mt-1" placeholder="vendor@example.com" />
                      </Form.Control>
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label className="text-sm font-medium text-gray-700">{t("fields.password")}</Form.Label>
                      <Form.Control>
                        <Input type="password" {...field} className="mt-1" placeholder="••••••••" />
                      </Form.Control>
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label className="text-sm font-medium text-gray-700">Confirm Password</Form.Label>
                      <Form.Control>
                        <Input type="password" {...field} className="mt-1" placeholder="••••••••" />
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
                {isPending ? "Creating account…" : "Create Vendor Account"}
              </button>
            </form>
          </Form>

          <div className="mt-5 text-center">
            <span className="text-gray-400 text-sm">
              <Trans
                i18nKey="register.alreadySeller"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
                    className="font-medium transition-colors hover:opacity-80"
                    style={{ color: "#4338ca" }}
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
