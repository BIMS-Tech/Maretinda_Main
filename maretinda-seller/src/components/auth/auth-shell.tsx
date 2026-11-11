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
      className="border-ui-border-base bg-ui-bg-base text-ui-fg-subtle hover:bg-ui-bg-base-hover hover:text-ui-fg-base flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors"
    >
      {theme === "dark" ? <Moon /> : theme === "light" ? <Sun /> : <CircleHalfSolid />}
    </button>
  )
}

// Deep aubergine with a lavender glow at the top and the brand's yellow at the bottom
const BRAND_BACKGROUND =
  "radial-gradient(900px 520px at -10% -15%, rgba(123, 88, 178, 0.75), transparent 60%)," +
  "radial-gradient(640px 420px at 115% 105%, rgba(255, 197, 51, 0.32), transparent 60%)," +
  "linear-gradient(160deg, #24172F 0%, #432C63 55%, #35234F 100%)"

const DOT_GRID = {
  backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
}

/** A frosted card on the brand side. */
export function GlassCard({ children, className = "", tilt = 0, delay = 0 }: { children: ReactNode; className?: string; tilt?: number; delay?: number }) {
  return (
    <div
      className={`brand-float rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md ${className}`}
      style={{ ["--tilt" as string]: `${tilt}deg`, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * The sign-in pages' layout: the brand side (headline and a glimpse of the
 * panel) and the form side. On phones the brand side shrinks to a header.
 */
export function AuthShell({
  portal,
  headline,
  lede,
  preview,
  footnote,
  children,
}: {
  portal: string
  headline: ReactNode
  lede: string
  preview?: ReactNode
  footnote?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-ui-bg-base flex min-h-dvh w-full">
      {/* Brand side */}
      <aside className="relative hidden w-[46%] max-w-[720px] flex-col justify-between overflow-hidden p-12 lg:flex" style={{ background: BRAND_BACKGROUND }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={DOT_GRID} />
        <Butterfly size={520} className="pointer-events-none absolute -bottom-40 -right-40 text-white opacity-[0.05]" />

        <div className="relative flex items-center gap-3">
          <img src="/Logo-maretinda-white.svg" alt="Maretinda" className="h-8 w-auto" />
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white/85">
            {portal}
          </span>
        </div>

        <div className="relative">
          <h1 className="font-display text-[44px] leading-[1.08] text-white xl:text-[52px]">{headline}</h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/70">{lede}</p>
          {preview && <div className="relative mt-10 h-[220px] max-w-[440px]">{preview}</div>}
        </div>

        <div className="relative text-xs text-white/45">{footnote ?? `© ${new Date().getFullYear()} Maretinda`}</div>
      </aside>

      {/* Form side */}
      <main className="relative flex flex-1 flex-col">
        {/* A faint lavender wash so the form side isn't flat */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(600px 360px at 100% 0%, rgb(var(--brand-purple) / 0.07), transparent 70%)" }}
        />

        {/* Phones: the brand side as a header */}
        <div className="relative overflow-hidden px-6 pb-8 pt-6 lg:hidden" style={{ background: BRAND_BACKGROUND }}>
          <div aria-hidden className="pointer-events-none absolute inset-0" style={DOT_GRID} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/Logo-maretinda-white.svg" alt="Maretinda" className="h-6 w-auto" />
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/85">
                {portal}
              </span>
            </div>
            <ThemeToggleButton />
          </div>
          <p className="font-display relative mt-6 text-[28px] leading-tight text-white">{headline}</p>
        </div>

        <div className="relative hidden justify-end p-6 lg:flex">
          <ThemeToggleButton />
        </div>

        <div className="relative flex flex-1 items-start justify-center px-6 py-10 lg:items-center lg:py-0">
          <div className="brand-rise w-full max-w-[400px]">{children}</div>
        </div>

        <div className="text-ui-fg-muted relative px-6 py-6 text-center text-xs lg:hidden">© {new Date().getFullYear()} Maretinda</div>
      </main>
    </div>
  )
}
