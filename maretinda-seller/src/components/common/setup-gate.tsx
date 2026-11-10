import { Clock, ExclamationCircle } from "@medusajs/icons"
import { Button, Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useSetupTasks } from "../../hooks/api/setup-tasks"

/**
 * Shows its children only once the shop can sell: setup done and documents
 * approved (lib/store-readiness). Otherwise it says what's left, or that
 * approval is pending. The API enforces the same rule.
 */
export const SetupGate = ({ feature, children }: { feature: string; children: ReactNode }) => {
  const { canSell, awaitingApproval, pending, isPending } = useSetupTasks()

  if (isPending) return null
  if (canSell) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center gap-y-5 px-8 py-16 text-center">
      <div className="bg-ui-tag-orange-bg text-ui-tag-orange-icon flex h-14 w-14 items-center justify-center rounded-full">
        {awaitingApproval ? <Clock /> : <ExclamationCircle />}
      </div>
      <div className="flex max-w-md flex-col items-center gap-y-2">
        <Heading level="h2">{awaitingApproval ? "Waiting for approval" : "Finish your store setup first"}</Heading>
        <Text className="text-ui-fg-subtle">
          {awaitingApproval
            ? `Our team is reviewing your documents. You can ${feature} as soon as they're approved.`
            : `You can ${feature} once your store is set up and approved.`}
        </Text>
        {!awaitingApproval && pending.length > 0 && (
          <ul className="text-ui-fg-subtle mt-1 text-sm">
            {pending.map((task) => (
              <li key={task.key}>
                <Link to={task.to} className="text-ui-fg-interactive hover:underline">
                  {task.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!awaitingApproval && (
        <Button size="small" asChild>
          <Link to="/dashboard">Go to setup checklist</Link>
        </Button>
      )}
    </div>
  )
}
