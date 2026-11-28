import { Spinner } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { AuthShell, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../../components/auth/auth-shell"
import { backendUrl, publishableApiKey } from "../../lib/client/client"

type Status = {
  status: "pending" | "rejected" | "approved" | "none"
  email: string | null
  shop_name: string | null
  submitted_at: string | null
  reviewed_at: string | null
  note: string | null
  /** Approval waits until the applicant confirms their email */
  email_verified?: boolean
}

const TOKEN_KEY = "medusa_auth_token"

const day = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : null

/**
 * What an applicant sees when they sign in before their shop exists: their
 * application is under review, wasn't approved, or was approved since they
 * signed in. Every seller-panel page needs a shop, so without this they were
 * bounced back to an empty sign-in form.
 */
export const ApplicationStatus = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<Status | null>(null)
  const [failed, setFailed] = useState(false)
  const [resend, setResend] = useState<{ sending: boolean; message?: string; ok?: boolean }>({ sending: false })

  const signOut = (to = "/login") => {
    window.localStorage.removeItem(TOKEN_KEY)
    navigate(to, { replace: true })
  }

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY)
    if (!token) {
      navigate("/login", { replace: true })
      return
    }
    fetch(`${backendUrl}/store/seller-application/status`, {
      headers: { authorization: `Bearer ${token}`, "x-publishable-api-key": publishableApiKey },
    })
      .then(async (res) => {
        if (res.status === 401) return signOut()
        if (!res.ok) throw new Error(String(res.status))
        setData(await res.json())
      })
      .catch(() => setFailed(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shop = data?.shop_name ? <b>{data.shop_name}</b> : "your shop"

  const resendLink = async () => {
    setResend({ sending: true })
    try {
      const res = await fetch(`${backendUrl}/store/email-verification/resend`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${window.localStorage.getItem(TOKEN_KEY)}`,
          "x-publishable-api-key": publishableApiKey,
          "content-type": "application/json",
        },
        body: "{}",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.message || "Please try again in a few minutes.")
      if (json.verified) {
        setData((d) => (d ? { ...d, email_verified: true } : d))
        setResend({ sending: false })
        return
      }
      setResend({
        sending: false,
        ok: !!json.sent,
        message: json.sent
          ? `We sent a new link to ${json.email}. Check your inbox and spam folder.`
          : "We couldn't send the email just now. Please try again in a few minutes.",
      })
    } catch (e) {
      setResend({ sending: false, ok: false, message: e instanceof Error ? e.message : "Please try again." })
    }
  }

  let heading = "Checking your application"
  let body: React.ReactNode = (
    <div className="flex justify-center py-6">
      <Spinner className="animate-spin text-ui-fg-interactive" />
    </div>
  )
  let actions: React.ReactNode = null

  if (failed) {
    heading = "We couldn't check your application"
    body = <p>Please try again in a moment. If it keeps happening, write to support@maretinda.com.</p>
    actions = (
      <>
        <button type="button" className={PRIMARY_BUTTON} onClick={() => window.location.reload()}>
          Try again
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={() => signOut()}>
          Sign out
        </button>
      </>
    )
  } else if (data?.status === "pending" && data.email_verified === false) {
    heading = "Confirm your email to finish applying"
    body = (
      <>
        <p>
          Thank you for applying to sell on Maretinda with {shop}. We sent a confirmation link to{" "}
          <b>{data.email ?? "your email"}</b>. Open it to confirm this is your address; our team reviews your
          application once it's confirmed.
        </p>
        <p className="text-ui-fg-muted text-sm">Can't find it? Check your spam folder, or send a new link.</p>
        {resend.message && (
          <p className={`text-sm ${resend.ok ? "text-ui-fg-interactive" : "text-ui-fg-error"}`} role="alert">
            {resend.message}
          </p>
        )}
      </>
    )
    actions = (
      <>
        <button type="button" className={PRIMARY_BUTTON} onClick={resendLink} disabled={resend.sending} data-testid="resend-confirmation">
          {resend.sending ? "Sending…" : "Send a new link"}
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={() => window.location.reload()}>
          I've confirmed it
        </button>
      </>
    )
  } else if (data?.status === "pending") {
    heading = "Your application is under review"
    body = (
      <>
        <p>
          Thank you for applying to sell on Maretinda with {shop}
          {data.submitted_at ? <> on {day(data.submitted_at)}</> : null}. Our team is reviewing your application, usually
          within a few business days.
        </p>
        <p>
          We'll email you{data.email ? <> at <b>{data.email}</b></> : null} as soon as it's approved. Then sign in here
          to choose your plan (the first month is free on Growth) and set up your shop.
        </p>
        <p className="text-ui-fg-muted text-sm">Questions? Write to support@maretinda.com.</p>
      </>
    )
    actions = (
      <button type="button" className={SECONDARY_BUTTON} onClick={() => signOut()}>
        Sign out
      </button>
    )
  } else if (data?.status === "rejected") {
    heading = "Your application wasn't approved"
    body = (
      <>
        <p>
          We reviewed your application for {shop}
          {data.reviewed_at ? <> on {day(data.reviewed_at)}</> : null} and couldn't approve it this time.
        </p>
        {data.note && (
          <p className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3 text-sm">
            <b>Note from our team:</b> {data.note}
          </p>
        )}
        <p>
          If you have more information to share, write to support@maretinda.com. You can also apply again with updated
          details.
        </p>
      </>
    )
    actions = (
      <>
        <button type="button" className={PRIMARY_BUTTON} onClick={() => signOut("/register")}>
          Apply again
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={() => signOut()}>
          Sign out
        </button>
      </>
    )
  } else if (data?.status === "approved") {
    heading = "Your shop is approved"
    body = <p>Good news: {shop} has been approved. Sign in again to open your seller panel.</p>
    actions = (
      <button type="button" className={PRIMARY_BUTTON} onClick={() => signOut()}>
        Sign in again
      </button>
    )
  } else if (data?.status === "none") {
    heading = "This sign-in has no shop"
    body = (
      <>
        <p>
          The email and password are right{data.email ? <> for <b>{data.email}</b></> : null}, but no shop goes with them
          yet. If you shop on Maretinda, sign in on the storefront instead.
        </p>
        <p>To sell, apply with this email: our team reviews applications, usually within a few business days.</p>
      </>
    )
    actions = (
      <>
        <button type="button" className={PRIMARY_BUTTON} onClick={() => signOut("/register")}>
          Apply to sell
        </button>
        {__STOREFRONT_URL__ && (
          <a href={__STOREFRONT_URL__} className={SECONDARY_BUTTON}>
            Go to the storefront
          </a>
        )}
        <button type="button" className={SECONDARY_BUTTON} onClick={() => signOut()}>
          Sign out
        </button>
      </>
    )
  }

  return (
    <AuthShell
      portal="Seller Centre"
      lines={
        data?.status === "rejected"
          ? ["Thanks for applying.", "We're here to help."]
          : data?.status === "none"
            ? ["Not a shop yet.", "Open one in minutes."]
            : ["Almost there.", "Your shop is on its way."]
      }
      lede={
        data?.status === "rejected"
          ? "Most applications that aren't approved just need a document or detail corrected."
          : data?.status === "none"
            ? "Tell us about your shop in a short chat. The first month is free on the Growth plan."
            : "Every shop on Maretinda is reviewed by our team before it opens to buyers."
      }
    >
      <div className="flex flex-col gap-5" data-testid="application-status" data-status={data?.status ?? (failed ? "error" : "loading")} data-email-verified={data ? String(data.email_verified !== false) : undefined}>
        <h1 className="font-display text-ui-fg-base text-[30px] leading-tight">{heading}</h1>
        <div className="text-ui-fg-subtle flex flex-col gap-3 text-[15px] leading-relaxed">{body}</div>
        {actions && <div className="flex flex-col gap-3 pt-2">{actions}</div>}
        <p className="text-center text-xs text-ui-fg-muted">
          <Link to="/login" onClick={() => window.localStorage.removeItem(TOKEN_KEY)} className="hover:underline">
            Use a different account
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
