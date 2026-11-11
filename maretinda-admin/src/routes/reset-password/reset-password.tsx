import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import * as z from "zod"

import { useState } from "react"
import { decodeToken } from "react-jwt"
import { Accent, AuthShell, PRIMARY_BUTTON } from "../../components/auth/auth-shell"
import { Form } from "../../components/common/form"
import { i18n } from "../../components/utilities/i18n"
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



const InvalidResetToken = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <AuthShell admin portal="Admin" headline={<>Locked out?<br /><Accent>Let&apos;s get you back in.</Accent></>} lede="We'll email you a link to set a new password. It works once, and only for a little while.">
          <div className="mb-8">
            <h2 className="font-display text-ui-fg-base mb-1 text-[34px] leading-tight">{t("resetPassword.invalidLinkTitle")}</h2>
            <p className="text-ui-fg-subtle text-sm">{t("resetPassword.invalidLinkHint")}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/reset-password", { replace: true })}
            className={PRIMARY_BUTTON}
          >
            {t("resetPassword.goToResetPassword")}
          </button>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-muted text-sm">
              <Trans
                i18nKey="resetPassword.backToLogin"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium"
                  />,
                ]}
              />
            </span>
          </div>
    </AuthShell>
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
    <AuthShell admin portal="Admin" headline={<>Locked out?<br /><Accent>Let&apos;s get you back in.</Accent></>} lede="We'll email you a link to set a new password. It works once, and only for a little while.">
          <div className="mb-8">
            <h2 className="font-display text-ui-fg-base mb-1 text-[34px] leading-tight">{t("resetPassword.resetPassword")}</h2>
            <p className="text-ui-fg-subtle text-sm">{t("resetPassword.newPasswordHint")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-3">
                <div className="flex flex-col gap-y-1">
                  <label className="text-sm font-medium text-ui-fg-base">{t("fields.email")}</label>
                  <Input
                    type="email"
                    disabled
                    value={invite?.entity_id}
                    className="mt-1"
                  />
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
                          className="mt-1.5 h-11"
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
                          className="mt-1.5 h-11"
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
                  className={PRIMARY_BUTTON}
                >
                  {isPending ? t("general.loading") + "…" : t("resetPassword.resetPassword")}
                </button>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-muted text-sm">
              <Trans
                i18nKey="resetPassword.backToLogin"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium"
                  />,
                ]}
              />
            </span>
          </div>
    </AuthShell>
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
    <AuthShell admin portal="Admin" headline={<>Locked out?<br /><Accent>Let&apos;s get you back in.</Accent></>} lede="We'll email you a link to set a new password. It works once, and only for a little while.">
          <div className="mb-8">
            <h2 className="font-display text-ui-fg-base mb-1 text-[34px] leading-tight">{t("resetPassword.resetPassword")}</h2>
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
                        placeholder="admin@maretinda.com"
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
                  className={PRIMARY_BUTTON}
                >
                  {isPending ? t("general.loading") + "…" : t("resetPassword.sendResetInstructions")}
                </button>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-muted text-sm">
              <Trans
                i18nKey="resetPassword.backToLogin"
                components={[
                  <Link
                    key="login-link"
                    to="/login"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium"
                  />,
                ]}
              />
            </span>
          </div>
    </AuthShell>
  )
}
