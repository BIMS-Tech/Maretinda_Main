import { ChevronDownMini, LightBulb } from "@medusajs/icons"
import { clx, Text } from "@medusajs/ui"
import { ReactNode, useState } from "react"

const KEY = "maretinda_howto_closed"

const closed = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

/**
 * Step-by-step directions for a screen, open until the seller closes them.
 * What each seller closed is remembered in their browser.
 */
export const HowTo = ({ id, title, steps, note }: { id: string; title: string; steps: ReactNode[]; note?: ReactNode }) => {
  const [open, setOpen] = useState(() => !closed().includes(id))

  const toggle = () => {
    const next = !open
    setOpen(next)
    try {
      const rest = closed().filter((x) => x !== id)
      window.localStorage.setItem(KEY, JSON.stringify(next ? rest : [...rest, id]))
    } catch {
      // Private window: it simply opens again next time
    }
  }

  return (
    <section className="border-ui-border-base bg-ui-bg-subtle rounded-lg border" data-testid={`how-to-${id}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <LightBulb className="text-ui-fg-interactive shrink-0" />
        <Text size="small" weight="plus" className="flex-1">
          {title}
        </Text>
        <ChevronDownMini className={clx("text-ui-fg-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <ol className="text-ui-fg-subtle flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {note && <p className="text-ui-fg-muted mt-3 text-xs leading-relaxed">{note}</p>}
        </div>
      )}
    </section>
  )
}
