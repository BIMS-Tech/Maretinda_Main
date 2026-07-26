import { CheckCircleSolid, Clock, ExclamationCircleSolid } from "@medusajs/icons"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

import { SetupTask, useSetupTasks } from "../../../hooks/api/setup-tasks"
import { CompletionBar } from "../completion-bar"

const TaskIcon = ({ task }: { task: SetupTask }) => {
  if (task.awaitingReview) {
    return <Clock className="text-ui-tag-orange-icon" />
  }

  if (task.complete) {
    return <CheckCircleSolid className="text-ui-tag-green-icon" />
  }

  return <ExclamationCircleSolid className="text-ui-tag-red-icon" />
}

/**
 * Outstanding onboarding steps, with a completion bar so the seller can see how
 * much of their company information is still missing. Renders nothing once the
 * seller has done everything on their side.
 */
export const SetupChecklist = () => {
  const { tasks, pendingCount, progress } = useSetupTasks()

  if (!pendingCount) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-4 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Heading>Complete your store setup</Heading>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-medium leading-none text-white">
                {pendingCount}
              </span>
            </div>
            <Text size="small" className="text-ui-fg-subtle text-pretty">
              Your store isn't ready to sell until these are done. Legal
              documents are reviewed by our team before your store is approved.
            </Text>
          </div>
          <div className="text-right">
            <Text size="large" weight="plus" leading="compact">
              {progress.percent}%
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              {progress.completedCount} of {progress.totalCount}
            </Text>
          </div>
        </div>
        <CompletionBar percent={progress.percent} />
      </div>

      <div className="flex flex-col divide-y">
        {tasks.map((task) => (
          <div
            key={task.key}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <div className="flex flex-1 items-start gap-3">
              <div className="mt-0.5">
                <TaskIcon task={task} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Text size="small" weight="plus" leading="compact">
                    {task.label}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {task.completedCount}/{task.totalCount}
                  </Text>
                </div>
                <Text size="small" className="text-ui-fg-subtle">
                  {task.description}
                </Text>
                {!task.complete && (
                  <div className="mt-2 max-w-xs">
                    <CompletionBar percent={task.progress} size="small" />
                  </div>
                )}
              </div>
            </div>
            {!task.complete && (
              <Button size="small" variant="secondary" asChild>
                <Link to={task.to}>Complete</Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </Container>
  )
}
