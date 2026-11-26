import {
  animate,
  AnimatePresence,
  motion,
  useAnimate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"
import { ReactNode, useEffect, useId, useRef } from "react"

/**
 * The panel's shared motion, the storefront's in miniature: things arrive
 * quickly and settle softly, nothing waits on an animation, and all of it is
 * off for anyone whose device asks for less motion. The seller and admin
 * panels keep the same copy of this file.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const

/** Children fade and rise in one after another. */
export const Stagger = ({ children, className, gap = 0.06 }: { children: ReactNode; className?: string; gap?: number }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 12 },
      shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
    }}
  >
    {children}
  </motion.div>
)

/** A number that counts to its value when it comes into view, and from there to each new one. */
export const CountUp = ({ value, format = (n) => Math.round(n).toLocaleString("en-PH") }: { value: number; format?: (n: number) => string }) => {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true })
  const count = useMotionValue(reduce ? value : 0)
  const text = useTransform(count, (n) => format(n))
  useEffect(() => {
    if (reduce) {
      count.set(value)
      return
    }
    if (!seen) return
    const controls = animate(count, value, { duration: 0.9, ease: EASE_OUT })
    return () => controls.stop()
  }, [value, reduce, count, seen])
  return (
    <motion.span ref={ref} className="tabular-nums" aria-label={format(value)}>
      {text}
    </motion.span>
  )
}

/** A heading whose words rise into place one after another, each from behind its own edge. */
export const MaskedText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const reduce = useReducedMotion()
  const words = text.split(" ")
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: delay + i * 0.06 }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/** A row of choices with a pill that slides to the one picked. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const id = useId()
  return (
    <div role="tablist" aria-label={label} className={`bg-ui-bg-subtle inline-flex items-center gap-0.5 rounded-full p-1 shadow-borders-base ${className}`}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative h-7 rounded-full px-3 text-xs font-medium outline-none transition-colors focus-visible:shadow-borders-focus ${
              active ? "text-white" : "text-ui-fg-subtle hover:text-ui-fg-base"
            }`}
          >
            {active && <motion.span layoutId={`segmented-${id}`} transition={SPRING} className="bg-ui-bg-interactive absolute inset-0 rounded-full" />}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** A bar that grows to its share when it comes into view. */
export const GrowBar = ({ share, className = "", delay = 0 }: { share: number; className?: string; delay?: number }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`h-full rounded-full ${className}`}
      initial={reduce ? false : { width: 0 }}
      whileInView={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
    />
  )
}

/** A small trend line that draws itself in. */
export const Sparkline = ({ points, className = "", width = 96, height = 32 }: { points: number[]; className?: string; width?: number; height?: number }) => {
  const reduce = useReducedMotion()
  if (points.length < 2) return null
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const d = points
    .map((p, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * (width - 4) + 2).toFixed(1)},${(height - 3 - ((p - min) / span) * (height - 6)).toFixed(1)}`)
    .join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden className={className}>
      <motion.path
        d={d}
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
      />
    </svg>
  )
}

/**
 * A submit button whose words change with what it's doing: its label,
 * "Signing in…" with a spinner, then a tick.
 */
export const MorphLabel = ({ state, idle, busy, done }: { state: "idle" | "busy" | "done"; idle: ReactNode; busy: ReactNode; done: ReactNode }) => (
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.span
      key={state}
      className="inline-flex items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
    >
      {state === "busy" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />}
      {state === "done" && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          />
        </svg>
      )}
      {state === "idle" ? idle : state === "busy" ? busy : done}
    </motion.span>
  </AnimatePresence>
)

/** Shakes its head once each time `again` changes: a refused form. What's typed in it stays. */
export const Shake = ({ again, children, className }: { again: number; children: ReactNode; className?: string }) => {
  const reduce = useReducedMotion()
  const [scope, shake] = useAnimate<HTMLDivElement>()
  useEffect(() => {
    if (again && !reduce && scope.current) shake(scope.current, { x: [0, -8, 7, -5, 3, 0] }, { duration: 0.42 })
  }, [again, reduce, scope, shake])
  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
