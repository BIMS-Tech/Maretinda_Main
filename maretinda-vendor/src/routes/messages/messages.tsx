import { useEffect, useRef, useState } from "react"
import { Badge, Button, Heading, Input, Text } from "@medusajs/ui"
import {
  ChatConversation,
  ChatMessage,
  useChatConversations,
  useChatMessages,
  useChatSSE,
  useMarkRead,
  useSendMessage,
} from "@hooks/api/chat"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" })
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function partyLabel(conv: ChatConversation): string {
  if (conv.type === "seller_admin") return "Support Team"
  return conv.customer_id ? "Customer" : "Unknown"
}

// ─── Conversation List Item ────────────────────────────────────────────────────

function ConvItem({
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
      className={`w-full text-left px-4 py-3 border-b border-ui-border-base hover:bg-ui-bg-subtle transition-colors flex items-start gap-3 ${
        selected ? "bg-ui-bg-subtle" : "bg-ui-bg-base"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-ui-button-neutral flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-ui-fg-on-color uppercase">
          {partyLabel(conv).charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-ui-fg-base text-sm font-medium truncate">
            {partyLabel(conv)}
          </span>
          <span className="text-ui-fg-muted text-xs shrink-0">
            {formatTime(conv.last_message_at)}
          </span>
        </div>
        {conv.subject && (
          <p className="text-ui-fg-subtle text-xs truncate mt-0.5">{conv.subject}</p>
        )}
      </div>
      {conv.unread_seller > 0 && (
        <Badge color="red" className="shrink-0 mt-0.5">
          {conv.unread_seller}
        </Badge>
      )}
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MsgBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const isAdmin = msg.sender_role === "admin"
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className={`text-xs mb-1 font-medium ${isAdmin ? "text-orange-600" : "text-ui-fg-muted"}`}>
            {isAdmin ? "Support Team" : msg.sender_name}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isOwn
              ? "bg-ui-button-inverted text-ui-fg-on-inverted rounded-tr-sm"
              : isAdmin
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
  const markRead = useMarkRead()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data?.messages?.length])

  useEffect(() => {
    if (convId) markRead.mutate(convId)
  }, [convId])

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
      <div className="px-6 py-4 border-b border-ui-border-base flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-ui-button-neutral flex items-center justify-center">
          <span className="text-xs font-semibold text-ui-fg-on-color uppercase">
            {partyLabel(conv!).charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-ui-fg-base text-sm font-semibold">{partyLabel(conv!)}</p>
          {conv?.subject && <p className="text-ui-fg-muted text-xs">{conv.subject}</p>}
        </div>
        {conv?.status === "closed" && (
          <Badge color="grey" className="ml-auto">Closed</Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Text size="small" className="text-ui-fg-muted">No messages yet. Say hello!</Text>
          </div>
        ) : (
          messages.map((msg) => (
            <MsgBubble key={msg.id} msg={msg} isOwn={msg.sender_role === "seller"} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {conv?.status !== "closed" && (
        <div className="px-4 py-3 border-t border-ui-border-base flex gap-2 shrink-0">
          <Input
            className="flex-1"
            placeholder="Type a message…"
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-ui-bg-subtle flex items-center justify-center">
        <svg className="w-8 h-8 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <Heading level="h3">Your Messages</Heading>
      <Text size="small" className="text-ui-fg-muted">
        Select a conversation from the list, or wait for customers to reach out.
      </Text>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Messages() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { data, isLoading } = useChatConversations()

  useChatSSE()

  const conversations = (data?.conversations || []).filter((c) => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return c.subject?.toLowerCase().includes(s) || c.type.includes(s)
  })

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base shrink-0">
        <div className="flex items-center gap-3">
          <Heading>Messages</Heading>
          {(data?.unread ?? 0) > 0 && (
            <Badge color="red">{data!.unread} unread</Badge>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-72 xl:w-80 border-r border-ui-border-base flex flex-col shrink-0">
          <div className="p-3 border-b border-ui-border-base">
            <Input
              type="search"
              placeholder="Search conversations…"
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
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  selected={selectedId === conv.id}
                  onClick={() => setSelectedId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: chat thread */}
        <div className="flex-1 flex min-w-0">
          {selectedId ? <ChatPanel key={selectedId} convId={selectedId} /> : <EmptyState />}
        </div>
      </div>
    </div>
  )
}
