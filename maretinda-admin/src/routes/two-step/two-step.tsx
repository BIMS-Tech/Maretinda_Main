import { Spinner } from "@medusajs/icons"
import { Input } from "@medusajs/ui"
import QRCode from "qrcode"
import { FormEvent, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Accent, AuthShell, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../../components/auth/auth-shell"
import { afterSecondStep, mfaApi, MfaStatus } from "../../hooks/api/admin-access"
import { sdk } from "../../lib/client"

type Stage =
  | { name: "loading" }
  | { name: "setup"; secret: string; qr: string }
  | { name: "codes"; codes: string[] }
  | { name: "verify" }

const groups = (s: string) => s.match(/.{1,4}/g)?.join(" ") ?? s

/**
 * The second step of signing in to the admin. A first-time admin sets up an
 * authenticator app (QR code, confirm a code, save recovery codes); after
 * that, every sign-in asks for the app's current code.
 */
export const TwoStep = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || "/"
  const [stage, setStage] = useState<Stage>({ name: "loading" })
  const [code, setCode] = useState("")
  const [useRecovery, setUseRecovery] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const signOut = async () => {
    await sdk.auth.logout().catch(() => null)
    window.localStorage.removeItem("medusa_admin_jwt")
    navigate("/login", { replace: true })
  }

  const startSetup = async () => {
    const { secret, otpauth_url } = await mfaApi.setup()
    setStage({ name: "setup", secret, qr: await QRCode.toDataURL(otpauth_url, { margin: 1, width: 220 }) })
  }

  useEffect(() => {
    sdk.client
      .fetch<MfaStatus>("/admin/mfa")
      .then((status) => (status.enabled ? setStage({ name: "verify" }) : startSetup()))
      .catch(() => navigate("/login", { replace: true, state: { from: location.state?.from } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = async () => {
    await afterSecondStep()
    navigate(from, { replace: true })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      if (stage.name === "setup") {
        const { recovery_codes } = await mfaApi.enable(code)
        setCode("")
        setStage({ name: "codes", codes: recovery_codes })
      } else if (stage.name === "verify") {
        await mfaApi.verify(code)
        await finish()
      }
    } catch (e: any) {
      setError(e?.message || "That code didn't work. Try the newest one.")
    } finally {
      setBusy(false)
    }
  }

  const download = (codes: string[]) => {
    const text = `Maretinda Admin recovery codes\nEach code works once, if you can't use your authenticator app.\n\n${codes.join("\n")}\n`
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "maretinda-admin-recovery-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const codeField = (
    <Input
      autoFocus
      autoComplete="one-time-code"
      inputMode={useRecovery ? "text" : "numeric"}
      placeholder={useRecovery ? "xxxx-xxxx" : "123 456"}
      value={code}
      onChange={(e) => setCode(useRecovery ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 6))}
      className="h-11 text-center text-lg tracking-[0.3em]"
      aria-label={useRecovery ? "Recovery code" : "Authenticator code"}
    />
  )

  return (
    <AuthShell
      portal="Admin"
      admin
      headline={
        <>
          One more step,
          <br />
          <Accent>to keep the marketplace safe.</Accent>
        </>
      }
      lede="Every admin signs in with their password and a code from an authenticator app on their phone, so a stolen password alone can't open the admin."
    >
      <div className="flex flex-col gap-5" data-testid="two-step" data-stage={stage.name}>
        {stage.name === "loading" && (
          <div className="flex justify-center py-10">
            <Spinner className="animate-spin text-ui-fg-interactive" />
          </div>
        )}

        {stage.name === "setup" && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h1 className="font-display text-ui-fg-base text-[28px] leading-tight">Set up two-step sign-in</h1>
            <ol className="text-ui-fg-subtle flex list-decimal flex-col gap-1.5 pl-5 text-sm">
              <li>Install an authenticator app on your phone, such as Google Authenticator or Microsoft Authenticator.</li>
              <li>In the app, add an account and scan this code.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <div className="flex flex-col items-center gap-2">
              <img src={stage.qr} alt="QR code for your authenticator app" className="rounded-lg bg-white p-2" width={220} height={220} />
              <p className="text-ui-fg-muted text-center text-xs">
                Can't scan it? Enter this key instead:
                <br />
                <span className="font-mono text-ui-fg-base select-all text-sm" data-testid="two-step-secret">
                  {groups(stage.secret)}
                </span>
              </p>
            </div>
            {codeField}
            {error && <p className="text-ui-fg-error text-sm" role="alert">{error}</p>}
            <button type="submit" className={PRIMARY_BUTTON} disabled={busy || code.length !== 6}>
              {busy ? "Checking…" : "Turn on two-step sign-in"}
            </button>
          </form>
        )}

        {stage.name === "codes" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-ui-fg-base text-[28px] leading-tight">Save your recovery codes</h1>
            <p className="text-ui-fg-subtle text-sm">
              If you lose your phone, each of these codes lets you sign in once. Keep them somewhere safe, like a password
              manager. They won't be shown again.
            </p>
            <ul className="grid grid-cols-2 gap-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4 font-mono text-sm" data-testid="recovery-codes">
              {stage.codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button type="button" className={SECONDARY_BUTTON} onClick={() => navigator.clipboard?.writeText(stage.codes.join("\n"))}>
                Copy
              </button>
              <button type="button" className={SECONDARY_BUTTON} onClick={() => download(stage.codes)}>
                Download
              </button>
            </div>
            <label className="text-ui-fg-base flex items-center gap-2 text-sm">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
              I've saved my recovery codes
            </label>
            <button type="button" className={PRIMARY_BUTTON} disabled={!saved} onClick={finish}>
              Continue to the admin
            </button>
          </div>
        )}

        {stage.name === "verify" && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <h1 className="font-display text-ui-fg-base text-[28px] leading-tight">
              {useRecovery ? "Enter a recovery code" : "Enter your code"}
            </h1>
            <p className="text-ui-fg-subtle text-sm">
              {useRecovery
                ? "Use one of the recovery codes you saved when you set up two-step sign-in. Each works once."
                : "Open your authenticator app and enter the 6-digit code for Maretinda Admin."}
            </p>
            {codeField}
            {error && <p className="text-ui-fg-error text-sm" role="alert">{error}</p>}
            <button type="submit" className={PRIMARY_BUTTON} disabled={busy || (!useRecovery && code.length !== 6) || !code}>
              {busy ? "Checking…" : "Continue"}
            </button>
            <button
              type="button"
              className="text-ui-fg-interactive text-sm hover:underline"
              onClick={() => {
                setUseRecovery((r) => !r)
                setCode("")
                setError("")
              }}
            >
              {useRecovery ? "Use my authenticator app instead" : "Lost your phone? Use a recovery code"}
            </button>
            <p className="text-ui-fg-muted text-center text-xs">No recovery codes left? Ask an owner to reset your two-step sign-in.</p>
          </form>
        )}

        {stage.name !== "codes" && (
          <button type="button" onClick={signOut} className="text-ui-fg-muted text-center text-xs hover:underline">
            Sign out
          </button>
        )}
      </div>
    </AuthShell>
  )
}
