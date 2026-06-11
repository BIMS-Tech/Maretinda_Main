import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Input } from "@medusajs/ui"
import { CircleHalfSolid, Moon, Sun } from "@medusajs/icons"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import * as z from "zod"

import { useState } from "react"
import { decodeToken } from "react-jwt"
import { Form } from "../../components/common/form"
import { i18n } from "../../components/utilities/i18n"
import { useTheme } from "../../providers/theme-provider"
import {
  useResetPasswordForEmailPass,
  useUpdateProviderForEmailPass,
} from "../../hooks/api/auth"

const ResetPasswordInstructionsSchema = z.object({
  email: z.string().email(),
})

const ResetPasswordSchema = z
  .object({
    password: z.string().min(1),
    repeat_password: z.string().min(1),
  })
  .superRefine(({ password, repeat_password }, ctx) => {
    if (password !== repeat_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("resetPassword.passwordMismatch"),
        path: ["repeat_password"],
      })
    }
  })

const ResetPasswordTokenSchema = z.object({
  entity_id: z.string(),
  provider: z.string(),
  exp: z.number(),
  iat: z.number(),
})

type DecodedResetPasswordToken = {
  entity_id: string
  provider: string
  exp: string
  iat: string
}

const validateDecodedResetPasswordToken = (
  decoded: any
): decoded is DecodedResetPasswordToken => {
  return ResetPasswordTokenSchema.safeParse(decoded).success
}

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

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
      style={{ backgroundColor: "#432C63" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#ffffff" }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#ffffff" }} />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <MaretindaFlower color="white" size={40} />
        <div>
          <span className="text-white text-2xl font-bold tracking-wide">Maretinda</span>
          <span
            className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}
          >
            Seller
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <h1 className="text-white text-4xl font-bold leading-tight mb-4">
          Secure your<br />
          account with<br />
          a new password
        </h1>
        <p className="text-white/70 text-base leading-relaxed max-w-xs">
          We'll send a reset link to your email. Follow the instructions to regain access to your seller account.
        </p>
      </div>

      <div className="relative z-10">
        <p className="text-white/40 text-xs">© {new Date().getFullYear()} Maretinda. All rights reserved.</p>
      </div>
    </div>
  )
}

const InvalidResetToken = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh w-dvw flex">
      <BrandPanel />
      <div className="flex-1 flex flex-col bg-ui-bg-base px-6 py-12">
        <div className="flex items-center justify-between mb-8 lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
            <MaretindaFlower color="#432C63" size={28} />
            <span className="text-xl font-bold" style={{ color: "#432C63" }}>Maretinda</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F2ECF8", color: "#432C63" }}>
              Seller
            </span>
          </div>
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-[360px] mx-auto flex flex-col justify-center flex-1">
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#F2ECF8", color: "#432C63" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Seller Portal
            </div>
            <h2 className="text-2xl font-bold text-ui-fg-base mb-1">{t("resetPassword.invalidLinkTitle")}</h2>
            <p className="text-ui-fg-subtle text-sm">{t("resetPassword.invalidLinkHint")}</p>
          </div>

          <div className="flex flex-col gap-y-3">
            <button
              type="button"
              onClick={() => navigate("/reset-password", { replace: true })}
              className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-150 hover:opacity-90"
              style={{ backgroundColor: "#432C63" }}
            >
              {t("resetPassword.goToResetPassword")}
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-subtle text-sm">
              <Trans
                i18nKey="resetPassword.backToLogin"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
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

const ChooseNewPassword = ({ token }: { token: string }) => {
  const { t } = useTranslation()
  const [showAlert, setShowAlert] = useState(false)

  const invite: DecodedResetPasswordToken | null = token
    ? decodeToken(token)
    : null

  const isValidResetPasswordToken =
    invite && validateDecodedResetPasswordToken(invite)

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      repeat_password: "",
    },
  })

  const { mutateAsync, isPending } = useUpdateProviderForEmailPass(token)

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    if (!invite) {
      return
    }

    await mutateAsync(
      { password },
      {
        onSuccess: () => {
          form.setValue("password", "")
          form.setValue("repeat_password", "")
          setShowAlert(true)
        },
        onError: (error) => {
          form.setError("root.serverError", { type: "manual", message: error.message })
        },
      }
    )
  })

  if (!isValidResetPasswordToken) {
    return <InvalidResetToken />
  }

  const serverError = form.formState.errors?.root?.serverError?.message

  return (
    <div className="min-h-dvh w-dvw flex">
      <BrandPanel />
      <div className="flex-1 flex flex-col bg-ui-bg-base px-6 py-12">
        <div className="flex items-center justify-between mb-8 lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
            <MaretindaFlower color="#432C63" size={28} />
            <span className="text-xl font-bold" style={{ color: "#432C63" }}>Maretinda</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F2ECF8", color: "#432C63" }}>
              Seller
            </span>
          </div>
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-[360px] mx-auto">
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#F2ECF8", color: "#432C63" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Seller Portal
            </div>
            <h2 className="text-2xl font-bold text-ui-fg-base mb-1">{t("resetPassword.resetPassword")}</h2>
            <p className="text-ui-fg-subtle text-sm">{t("resetPassword.newPasswordHint")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-3">
                <div className="flex flex-col gap-y-1">
                  <label className="text-sm font-medium text-ui-fg-base">{t("fields.email")}</label>
                  <Input type="email" disabled value={invite?.entity_id} />
                </div>
                <Form.Field
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label className="text-sm font-medium text-ui-fg-base">
                        {t("resetPassword.newPassword")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          autoComplete="new-password"
                          type="password"
                          {...field}
                          className="mt-1"
                          placeholder="••••••••"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="repeat_password"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label className="text-sm font-medium text-ui-fg-base">
                        {t("resetPassword.repeatNewPassword")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          autoComplete="off"
                          type="password"
                          {...field}
                          className="mt-1"
                          placeholder="••••••••"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              {serverError && (
                <Alert className="bg-ui-bg-base items-center p-2" dismissible variant="error">
                  {serverError}
                </Alert>
              )}

              {showAlert ? (
                <Alert dismissible variant="success">
                  <div className="flex flex-col">
                    <span className="text-ui-fg-base mb-1 font-medium">
                      {t("resetPassword.successfulResetTitle")}
                    </span>
                    <span className="text-sm">{t("resetPassword.successfulReset")}</span>
                  </div>
                </Alert>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1 hover:opacity-90"
                  style={{ backgroundColor: "#432C63" }}
                >
                  {isPending ? t("general.loading") + "…" : t("resetPassword.resetPassword")}
                </button>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-subtle text-sm">
              <Trans
                i18nKey="resetPassword.backToLogin"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
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

export const ResetPassword = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [showAlert, setShowAlert] = useState(false)

  const token = searchParams.get("token")

  const form = useForm<z.infer<typeof ResetPasswordInstructionsSchema>>({
    resolver: zodResolver(ResetPasswordInstructionsSchema),
    defaultValues: {
      email: "",
    },
  })

  const { mutateAsync, isPending } = useResetPasswordForEmailPass()

  const handleSubmit = form.handleSubmit(async ({ email }) => {
    await mutateAsync(
      { email },
      {
        onSuccess: () => {
          form.setValue("email", "")
          setShowAlert(true)
        },
        onError: (error) => {
          form.setError("root.serverError", { type: "manual", message: error.message })
        },
      }
    )
  })

  if (token) {
    return <ChooseNewPassword token={token} />
  }

  const serverError = form.formState.errors?.root?.serverError?.message

  return (
    <div className="min-h-dvh w-dvw flex">
      <BrandPanel />

      <div className="flex-1 flex flex-col bg-ui-bg-base px-6 py-12">
        <div className="flex items-center justify-between mb-8 lg:justify-end">
          <div className="lg:hidden flex items-center gap-2">
            <MaretindaFlower color="#432C63" size={28} />
            <span className="text-xl font-bold" style={{ color: "#432C63" }}>Maretinda</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F2ECF8", color: "#432C63" }}>
              Seller
            </span>
          </div>
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-[360px] mx-auto">
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "#F2ECF8", color: "#432C63" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Seller Portal
            </div>
            <h2 className="text-2xl font-bold text-ui-fg-base mb-1">{t("resetPassword.resetPassword")}</h2>
            <p className="text-ui-fg-subtle text-sm">{t("resetPassword.hint")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="email"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label className="text-sm font-medium text-ui-fg-base">
                      {t("fields.email")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="email"
                        {...field}
                        className="mt-1"
                        placeholder="seller@example.com"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              {serverError && (
                <Alert className="bg-ui-bg-base items-center p-2" dismissible variant="error">
                  {serverError}
                </Alert>
              )}

              {showAlert ? (
                <Alert dismissible variant="success">
                  <div className="flex flex-col">
                    <span className="text-ui-fg-base mb-1 font-medium">
                      {t("resetPassword.successfulRequestTitle")}
                    </span>
                    <span className="text-sm">{t("resetPassword.successfulRequest")}</span>
                  </div>
                </Alert>
              ) : (
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: "#432C63" }}
                >
                  {isPending ? t("general.loading") + "…" : t("resetPassword.sendResetInstructions")}
                </button>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-subtle text-sm">
              <Trans
                i18nKey="resetPassword.backToLogin"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
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
