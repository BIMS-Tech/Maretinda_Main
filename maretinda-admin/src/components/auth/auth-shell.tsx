import { CircleHalfSolid, Moon, Sun } from "@medusajs/icons"
import type { ReactNode } from "react"

import { useTheme } from "../../providers/theme-provider"

/** The Maretinda butterfly: four petals around the centre. */
export function Butterfly({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      {[45, 135, 225, 315].map((angle) => (
        <path key={angle} d="M16,17 C12.5,14 11,7.5 16,5 C21,7.5 19.5,14 16,17Z" fill="currentColor" transform={`rotate(${angle},16,16)`} />
      ))}
    </svg>
  )
}

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Theme: ${theme}. Switch to ${next}`}
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      className="auth-glass text-ui-fg-subtle hover:text-ui-fg-base flex h-9 w-9 items-center justify-center rounded-full transition-colors"
    >
      {theme === "dark" ? <Moon /> : theme === "light" ? <Sun /> : <CircleHalfSolid />}
    </button>
  )
}

/** A small frosted card floating beside the form. */
export function GlassCard({ children, className = "", tilt = 0, delay = 0 }: { children: ReactNode; className?: string; tilt?: number; delay?: number }) {
  return (
    <div
      className={`auth-glass brand-float rounded-2xl p-4 text-[#2A1B3F] dark:text-white ${className}`}
      style={{ ["--tilt" as string]: `${tilt}deg`, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** The sign-in pages' main button. */
export const PRIMARY_BUTTON =
  "bg-ui-button-inverted hover:bg-ui-button-inverted-hover active:bg-ui-button-inverted-pressed shadow-buttons-inverted focus-visible:shadow-buttons-inverted-focus transition-fg flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"

/** A quieter companion to it. */
export const SECONDARY_BUTTON =
  "border-ui-border-base text-ui-fg-base hover:bg-ui-bg-base-hover hover:border-ui-border-interactive flex h-11 w-full items-center justify-center rounded-lg border text-[15px] font-medium transition-colors"

/** The headline's second line: brand purple on the light wash, brand yellow on the dark. */
export const Accent = ({ children }: { children: ReactNode }) => (
  <span className="italic text-[#6B4C9A] dark:text-[#FFC533]">{children}</span>
)

/**
 * The sign-in pages' layout: one background edge to edge, the headline and a
 * glimpse of the panel floating on it, and the form on a frosted glass card.
 * On phones the card comes first, under the wordmark.
 */
export function AuthShell({
  portal,
  headline,
  lede,
  preview,
  wide = false,
  flush = false,
  admin = false,
  children,
}: {
  portal: string
  headline?: ReactNode
  lede?: string
  preview?: ReactNode
  /** A roomier card, for the sign-up conversation */
  wide?: boolean
  /** No padding, a fixed height: the card's content lays itself out and scrolls */
  flush?: boolean
  /** The admin's darker twin of the background */
  admin?: boolean
  children: ReactNode
}) {
  return (
    <div className={`auth-bg relative flex min-h-dvh w-full flex-col overflow-hidden ${admin ? "auth-admin" : ""}`}>
      <div aria-hidden className="auth-dots pointer-events-none absolute inset-0" />
      <Butterfly size={620} className="pointer-events-none absolute -bottom-52 -left-48 text-[#432C63] opacity-[0.05] dark:text-white dark:opacity-[0.04]" />

      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <img src="/Logo-maretinda.svg" alt="Maretinda" className="h-7 w-auto dark:hidden" />
          <img src="/Logo-maretinda-white.svg" alt="Maretinda" className="hidden h-7 w-auto dark:block" />
          <span className="auth-glass rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[#432C63] dark:text-white/85">
            {portal}
          </span>
        </div>
        <ThemeToggleButton />
      </header>

      <main className="relative mx-auto flex w-full max-w-[1200px] flex-1 items-center gap-16 px-6 pb-10 pt-2 sm:px-10 lg:py-10">
        {headline && (
          <section className="hidden flex-1 lg:block">
            <h1 className="font-display text-[44px] leading-[1.08] text-[#2A1B3F] dark:text-white xl:text-[54px]">{headline}</h1>
            {lede && <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#4A3A63] dark:text-white/70">{lede}</p>}
            {preview && <div className="relative mt-12 h-[220px] max-w-[460px]">{preview}</div>}
          </section>
        )}

        <div
          className={`brand-rise auth-glass mx-auto w-full rounded-3xl ${wide ? "max-w-[640px]" : "max-w-[460px]"} ${headline ? "lg:mx-0" : ""} ${
            flush ? "flex h-[min(760px,calc(100dvh-150px))] min-h-[520px] flex-col overflow-hidden" : "p-7 sm:p-10"
          }`}
        >
          {children}
        </div>
      </main>

      <footer className="relative px-6 pb-6 text-center text-xs text-[#4A3A63]/70 dark:text-white/45">© {new Date().getFullYear()} Maretinda</footer>
    </div>
  )
}
