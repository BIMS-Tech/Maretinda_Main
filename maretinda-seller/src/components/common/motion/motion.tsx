import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { ReactNode, useEffect } from "react"

/**
 * The panel's shared motion: quick (≤ 250 ms), never blocking, and off for
 * anyone who prefers reduced motion.
 */

/** Children fade and rise in one after another. */
export const Stagger = ({ children, className }: { children: ReactNode; className?: string }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 8 },
      shown: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
    }}
  >
    {children}
  </motion.div>
)

/** A number that counts up to its value. */
export const CountUp = ({ value, format = (n) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) => {
  const reduce = useReducedMotion()
  const count = useMotionValue(reduce ? value : 0)
  const text = useTransform(count, (n) => format(n))
  useEffect(() => {
    if (reduce) {
      count.set(value)
      return
    }
    const controls = animate(count, value, { duration: 0.6, ease: "easeOut" })
    return () => controls.stop()
  }, [value, reduce, count])
  return <motion.span>{text}</motion.span>
}
