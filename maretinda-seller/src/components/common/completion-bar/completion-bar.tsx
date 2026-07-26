import { clx } from "@medusajs/ui"

type CompletionBarProps = {
  /** 0–100. */
  percent: number
  size?: "small" | "base"
  className?: string
}

/**
 * Determinate progress bar. The app's other `ProgressBar` is an indeterminate
 * route-loading indicator and can't show a known percentage.
 */
export const CompletionBar = ({
  percent,
  size = "base",
  className,
}: CompletionBarProps) => {
  const value = Math.max(0, Math.min(100, Math.round(percent)))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Setup completion"
      className={clx(
        "bg-ui-bg-component w-full overflow-hidden rounded-full",
        size === "small" ? "h-1" : "h-2",
        className
      )}
    >
      <div
        className={clx(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          value === 100 ? "bg-ui-tag-green-icon" : "bg-ui-tag-orange-icon"
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
