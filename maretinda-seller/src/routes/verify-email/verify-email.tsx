import { Spinner } from "@medusajs/icons"
import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { Accent, AuthShell, PRIMARY_BUTTON } from "../../components/auth/auth-shell"
import { backendUrl, publishableApiKey } from "../../lib/client/client"

/**
 * Where the "confirm your email" link sent with a seller application lands.
 * Confirms in the browser, so a mail scanner opening the link doesn't count
 * and a second click just says it's already done.
 */
export const VerifyEmail = () => {
  const [params] = useSearchParams()
  const token = params.get("token")
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(
    token ? null : { ok: false, message: "This link is missing its code. Open the link from the email again." }
  )
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    fetch(`${backendUrl}/store/email-verification/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-publishable-api-key": publishableApiKey },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) return setState({ ok: false, message: json?.message || "We couldn't confirm your email. Please try again." })
        setState({
          ok: true,
          message: json.already ? `${json.email} was already confirmed.` : `Thanks! ${json.email} is confirmed.`,
        })
      })
      .catch(() => setState({ ok: false, message: "We couldn't reach Maretinda. Check your connection and try again." }))
  }, [token])

  return (
    <AuthShell
      portal="Seller Centre"
      headline={
        <>
          One step closer.
          <br />
          <Accent>Your shop is on its way.</Accent>
        </>
      }
      lede="Every shop on Maretinda is reviewed by our team before it opens to buyers."
    >
      <div className="flex flex-col gap-5" data-testid="verify-email" data-state={state ? (state.ok ? "done" : "failed") : "loading"}>
        <h1 className="font-display text-ui-fg-base text-[30px] leading-tight">Confirm your email</h1>
        {!state ? (
          <div className="flex justify-center py-6">
            <Spinner className="animate-spin text-ui-fg-interactive" />
          </div>
        ) : (
          <div className="text-ui-fg-subtle flex flex-col gap-3 text-[15px] leading-relaxed">
            <p className={state.ok ? undefined : "text-ui-fg-error"}>{state.message}</p>
            {state.ok ? (
              <p>Our team will now review your application. We'll email you as soon as there is a decision.</p>
            ) : (
              <p>Sign in to see your application and send yourself a new link.</p>
            )}
          </div>
        )}
        {state && (
          <Link to="/login" className={PRIMARY_BUTTON}>
            {state.ok ? "Go to sign in" : "Sign in"}
          </Link>
        )}
      </div>
    </AuthShell>
  )
}
