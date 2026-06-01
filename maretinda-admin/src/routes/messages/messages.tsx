import { useEffect, useRef, useState } from "react"
import { Badge, Button, Heading, Input, Text } from "@medusajs/ui"
import {
  ChatConversation,
  ChatMessage,
  useCloseConversation,
  useChatConversations,
  useChatMessages,
  useChatSSE,
  useCreateConversation,
  useMarkRead,
  useSendMessage,
} from "@hooks/api/chat"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" })
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

const TYPE_LABEL: Record<string, string> = {
  vendor_customer: "Customer ↔ Vendor",
  vendor_admin: "Vendor ↔ Support",
  customer_admin: "Customer ↔ Support",
}

function typeColor(type: string) {
  if (type === "vendor_admin") return "orange"
  if (type === "customer_admin") return "blue"
  return "grey"
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConvRow({
  conv,
  selected,
  onClick,
}: {
  conv: ChatConversation
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-ui-border-base hover:bg-ui-bg-subtle transition-colors flex items-center gap-3 ${
        selected ? "bg-ui-bg-subtle" : "bg-ui-bg-base"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-ui-button-neutral flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-ui-fg-on-color">
          {conv.type === "vendor_admin" ? "V" : conv.type === "customer_admin" ? "C" : "VC"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge color={typeColor(conv.type) as any} size="xsmall">
            {TYPE_LABEL[conv.type] || conv.type}
          </Badge>
          {conv.status === "closed" && <Badge color="grey" size="xsmall">Closed</Badge>}
        </div>
        {conv.subject && (
          <p className="text-ui-fg-subtle text-xs truncate mt-0.5">{conv.subject}</p>
        )}
        <p className="text-ui-fg-muted text-xs mt-0.5">{formatTime(conv.last_message_at)}</p>
      </div>
      {conv.unread_admin > 0 && (
        <Badge color="red">{conv.unread_admin}</Badge>
      )}
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MsgBubble({ msg }: { msg: ChatMessage }) {
  const isAdmin = msg.sender_role === "admin"
  const isVendor = msg.sender_role === "vendor"

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[72%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
        <span className={`text-xs mb-1 font-medium ${
          isAdmin ? "text-ui-fg-interactive" : isVendor ? "text-orange-600" : "text-ui-fg-muted"
        }`}>
          {isAdmin ? "You (Support)" : isVendor ? `Vendor — ${msg.sender_name}` : `Customer — ${msg.sender_name}`}
        </span>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isAdmin
              ? "bg-ui-button-inverted text-ui-fg-on-inverted rounded-tr-sm"
              : isVendor
              ? "bg-orange-50 text-orange-900 border border-orange-200 rounded-tl-sm"
              : "bg-ui-bg-subtle text-ui-fg-base border border-ui-border-base rounded-tl-sm"
          }`}
        >
          {msg.body}
        </div>
        <span className="text-ui-fg-muted text-xs mt-1">{formatTime(msg.created_at)}</span>
      </div>
    </div>
  )
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({ convId }: { convId: string }) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useChatMessages(convId)
  const sendMsg = useSendMessage(convId)
  const closeConv = useCloseConversation()
  const markRead = useMarkRead()

  useEffect(() => {
    if (convId) markRead.mutate(convId)
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data?.messages?.length])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    sendMsg.mutate({ body: trimmed })
    setInput("")
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ui-border-interactive border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const conv = data?.conversation
  const messages = data?.messages || []

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-3 border-b border-ui-border-base flex items-center gap-3 shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge color={typeColor(conv?.type || "") as any}>
              {TYPE_LABEL[conv?.type || ""] || conv?.type}
            </Badge>
            {conv?.status === "closed" && <Badge color="grey">Closed</Badge>}
          </div>
          {conv?.subject && (
            <p className="text-ui-fg-muted text-xs mt-1">{conv.subject}</p>
          )}
        </div>
        {conv?.status !== "closed" && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => closeConv.mutate(convId)}
            disabled={closeConv.isPending}
          >
            Close conversation
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Text size="small" className="text-ui-fg-muted">No messages in this conversation yet.</Text>
          </div>
        ) : (
          messages.map((msg) => <MsgBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {conv?.status !== "closed" && (
        <div className="px-4 py-3 border-t border-ui-border-base flex gap-2 shrink-0">
          <Input
            className="flex-1"
            placeholder="Reply as Support Team…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button onClick={handleSend} disabled={sendMsg.isPending || !input.trim()} size="small">
            Send
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── New Conversation Modal ───────────────────────────────────────────────────

function NewConvForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<"vendor_admin" | "customer_admin">("vendor_admin")
  const [partyId, setPartyId] = useState("")
  const [subject, setSubject] = useState("")
  const create = useCreateConversation()

  const handleSubmit = () => {
    if (!partyId.trim()) return
    create.mutate(
      {
        vendor_id: type === "vendor_admin" ? partyId.trim() : undefined,
        customer_id: type === "customer_admin" ? partyId.trim() : undefined,
        subject: subject.trim() || undefined,
        type,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-ui-bg-base rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <Heading level="h2">New Conversation</Heading>

        <div>
          <Text size="small" className="text-ui-fg-subtle mb-2 font-medium">Type</Text>
          <div className="flex gap-2">
            <Button
              variant={type === "vendor_admin" ? "primary" : "secondary"}
              size="small"
              onClick={() => setType("vendor_admin")}
            >
              Contact Vendor
            </Button>
            <Button
              variant={type === "customer_admin" ? "primary" : "secondary"}
              size="small"
              onClick={() => setType("customer_admin")}
            >
              Contact Customer
            </Button>
          </div>
        </div>

        <div>
          <Text size="small" className="text-ui-fg-subtle mb-1 font-medium">
            {type === "vendor_admin" ? "Seller ID" : "Customer ID"}
          </Text>
          <Input
            placeholder={type === "vendor_admin" ? "seller_xxx" : "cus_xxx"}
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
          />
        </div>

        <div>
          <Text size="small" className="text-ui-fg-subtle mb-1 font-medium">Subject (optional)</Text>
          <Input
            placeholder="e.g. Account review"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button
            size="small"
            onClick={handleSubmit}
            disabled={create.isPending || !partyId.trim()}
          >
            {create.isPending ? "Creating…" : "Start conversation"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Messages = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const { data, isLoading } = useChatConversations()

  useChatSSE()

  const conversations = (data?.conversations || []).filter((c) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      c.subject?.toLowerCase().includes(s) ||
      (TYPE_LABEL[c.type] || c.type).toLowerCase().includes(s)
    )
  })

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base shrink-0">
        <div className="flex items-center gap-3">
          <Heading>Chat Monitor</Heading>
          {(data?.unread ?? 0) > 0 && (
            <Badge color="red">{data!.unread} unread</Badge>
          )}
        </div>
        <Button size="small" onClick={() => setShowNewForm(true)}>
          + New Conversation
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-72 xl:w-80 border-r border-ui-border-base flex flex-col shrink-0">
          <div className="p-3 border-b border-ui-border-base">
            <Input
              type="search"
              placeholder="Filter conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-5 h-5 border-2 border-ui-border-interactive border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 px-4 text-center">
                <Text size="small" className="text-ui-fg-muted">
                  {search ? "No conversations match." : "No conversations yet."}
                </Text>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConvRow
                  key={conv.id}
                  conv={conv}
                  selected={selectedId === conv.id}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: chat panel */}
        <div className="flex-1 flex min-w-0">
          {selectedId ? (
            <ChatPanel key={selectedId} convId={selectedId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-ui-bg-subtle flex items-center justify-center">
                <svg className="w-8 h-8 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <Heading level="h3">Chat Monitor</Heading>
              <Text size="small" className="text-ui-fg-muted">
                Select a conversation to view messages and respond, or start a new one.
              </Text>
            </div>
          )}
        </div>
      </div>

      {showNewForm && <NewConvForm onClose={() => setShowNewForm(false)} />}
    </div>
  )
}
