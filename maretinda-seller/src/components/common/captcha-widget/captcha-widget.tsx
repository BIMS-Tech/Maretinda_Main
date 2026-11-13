import { useEffect, useRef } from "react"

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

/** Cloudflare Turnstile's site key. The check is off until it is set. */
export const CAPTCHA_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY || ""

let loading: Promise<void> | null = null

function loadScript(): Promise<void> {
  if ((window as any).turnstile) return Promise.resolve()
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        loading = null
        reject(new Error("captcha script failed to load"))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}

/**
 * The "verify you are human" check. Hands the token to onToken once the
 * visitor passes, and an empty string when it expires or fails. A token works
 * once: change resetKey after each submit attempt to get a fresh one.
 * Renders nothing when no site key is configured.
 */
export const CaptchaWidget = ({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string) => void
  resetKey?: number
}) => {
  const holder = useRef<HTMLDivElement>(null)
  const report = useRef(onToken)
  report.current = onToken

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return
    let widget: string | undefined
    let gone = false
    report.current("")
    loadScript()
      .then(() => {
        if (gone || !holder.current) return
        widget = (window as any).turnstile.render(holder.current, {
          sitekey: CAPTCHA_SITE_KEY,
          callback: (token: string) => report.current(token),
          "expired-callback": () => report.current(""),
          "error-callback": () => report.current(""),
        })
      })
      .catch(() => report.current(""))
    return () => {
      gone = true
      if (widget) (window as any).turnstile?.remove(widget)
    }
  }, [resetKey])

  if (!CAPTCHA_SITE_KEY) return null
  return <div ref={holder} data-testid="captcha" />
}
