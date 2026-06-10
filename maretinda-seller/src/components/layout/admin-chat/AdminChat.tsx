import { ChatBubble } from "@medusajs/icons"
import { Drawer, Heading, IconButton } from "@medusajs/ui"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export const AdminChat = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <IconButton
          variant="transparent"
          className="text-ui-fg-muted hover:text-ui-fg-subtle"
        >
          <ChatBubble />
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading>Messages</Heading>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-ui-fg-subtle text-sm">
            Use the Messages page to chat with customers.
          </p>
          <button
            className="text-ui-fg-interactive text-sm underline"
            onClick={() => { setOpen(false); navigate("/messages") }}
          >
            Go to Messages →
          </button>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}
