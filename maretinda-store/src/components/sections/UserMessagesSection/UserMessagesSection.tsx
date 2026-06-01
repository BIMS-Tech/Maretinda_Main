'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatConversation {
	id: string
	type: string
	vendor_id: string | null
	customer_id: string | null
	subject: string | null
	status: string
	last_message_at: string | null
	unread_customer: number
	created_at: string
}

interface ChatMessage {
	id: string
	conversation_id: string
	sender_id: string
	sender_role: 'vendor' | 'customer' | 'admin'
	sender_name: string
	body: string
	read_at: string | null
	created_at: string
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function chatFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(path, {
		...init,
		headers: { 'Content-Type': 'application/json', ...init.headers },
	})
	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: 'Request failed' }))
		throw new Error(err.message)
	}
	return res.json()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
	if (!iso) return ''
	const d = new Date(iso)
	const now = new Date()
	const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
	if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	if (diffDays === 1) return 'Yesterday'
	if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
	return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function convLabel(conv: ChatConversation): string {
	if (conv.type === 'customer_admin') return 'Support Team'
	if (conv.type === 'vendor_customer') return conv.subject || 'Vendor'
	return conv.subject || 'Conversation'
}

function convInitial(conv: ChatConversation): string {
	if (conv.type === 'customer_admin') return 'S'
	return 'V'
}

// ─── ConvItem ─────────────────────────────────────────────────────────────────

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
			className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
				selected ? 'bg-gray-50' : 'bg-white'
			}`}
		>
			<div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
				<span className="text-xs font-bold text-gray-600">{convInitial(conv)}</span>
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-1">
					<span className="text-gray-900 text-sm font-medium truncate">{convLabel(conv)}</span>
					<span className="text-gray-400 text-xs shrink-0">{formatTime(conv.last_message_at)}</span>
				</div>
				{conv.status === 'closed' && (
					<span className="mt-1 inline-block text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
						Closed
					</span>
				)}
			</div>
			{conv.unread_customer > 0 && (
				<span className="shrink-0 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1.5 mt-0.5">
					{conv.unread_customer}
				</span>
			)}
		</button>
	)
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
	const isOwn = msg.sender_role === 'customer'
	const isAdmin = msg.sender_role === 'admin'

	return (
		<div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
			<div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
				{!isOwn && (
					<span className={`text-xs mb-1 font-medium ${isAdmin ? 'text-orange-600' : 'text-gray-500'}`}>
						{isAdmin ? 'Support Team' : msg.sender_name}
					</span>
				)}
				<div
					className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
						isOwn
							? 'bg-black text-white rounded-tr-sm'
							: isAdmin
							? 'bg-orange-50 text-orange-900 border border-orange-200 rounded-tl-sm'
							: 'bg-gray-100 text-gray-900 rounded-tl-sm'
					}`}
				>
					{msg.body}
				</div>
				<span className="text-gray-400 text-xs mt-1">{formatTime(msg.created_at)}</span>
			</div>
		</div>
	)
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

function ChatPanel({
	conv,
	onNewMessage,
}: {
	conv: ChatConversation
	onNewMessage: (msg: ChatMessage) => void
}) {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [loading, setLoading] = useState(true)
	const [input, setInput] = useState('')
	const [sending, setSending] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setLoading(true)
		chatFetch<{ conversation: ChatConversation; messages: ChatMessage[]; count: number }>(
			`/api/chat/${conv.id}`
		)
			.then((data) => {
				setMessages(data.messages)
				setLoading(false)
			})
			.catch(() => setLoading(false))

		// Mark conversation as read
		fetch(`/api/chat/${conv.id}/read`, { method: 'POST' }).catch(() => {})
	}, [conv.id])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	const handleIncomingMessage = useCallback((msg: ChatMessage) => {
		setMessages((prev) => {
			if (prev.some((m) => m.id === msg.id)) return prev
			return [...prev, msg]
		})
	}, [])

	// Expose handler so parent SSE can push messages in
	useEffect(() => {
		;(window as any).__chatPanelPush = handleIncomingMessage
		return () => { delete (window as any).__chatPanelPush }
	}, [handleIncomingMessage])

	const handleSend = async () => {
		const trimmed = input.trim()
		if (!trimmed || sending) return
		setSending(true)
		setInput('')
		try {
			const data = await chatFetch<{ message: ChatMessage }>(`/api/chat/${conv.id}/message`, {
				method: 'POST',
				body: JSON.stringify({ body: trimmed }),
			})
			setMessages((prev) => {
				if (prev.some((m) => m.id === data.message.id)) return prev
				return [...prev, data.message]
			})
			onNewMessage(data.message)
		} catch {
			setInput(trimmed)
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="flex-1 flex flex-col min-h-0 min-w-0">
			{/* Header */}
			<div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 shrink-0 bg-white">
				<div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
					<span className="text-xs font-bold text-gray-600">{convInitial(conv)}</span>
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-gray-900 text-sm font-semibold truncate">{convLabel(conv)}</p>
					{conv.subject && <p className="text-gray-500 text-xs truncate">{conv.subject}</p>}
				</div>
				{conv.status === 'closed' && (
					<span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded shrink-0">Closed</span>
				)}
			</div>

			{/* Messages */}
			{loading ? (
				<div className="flex-1 flex items-center justify-center bg-gray-50">
					<div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
				</div>
			) : (
				<div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
					{messages.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
						</div>
					) : (
						messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
					)}
					<div ref={bottomRef} />
				</div>
			)}

			{/* Input */}
			{conv.status !== 'closed' && (
				<div className="px-4 py-3 border-t border-gray-200 flex gap-2 shrink-0 bg-white">
					<input
						className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-400"
						placeholder="Type a message…"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								handleSend()
							}
						}}
					/>
					<button
						onClick={handleSend}
						disabled={sending || !input.trim()}
						className="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-900 transition-colors shrink-0"
					>
						{sending ? '…' : 'Send'}
					</button>
				</div>
			)}
		</div>
	)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const UserMessagesSection = () => {
	const [conversations, setConversations] = useState<ChatConversation[]>([])
	const [selected, setSelected] = useState<ChatConversation | null>(null)
	const [loading, setLoading] = useState(true)

	const loadConversations = useCallback(async () => {
		try {
			const data = await chatFetch<{ conversations: ChatConversation[]; count: number; unread: number }>(
				'/api/chat'
			)
			setConversations(data.conversations)
		} catch {
			// silently ignore auth errors etc.
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadConversations()
	}, [loadConversations])

	// SSE — push real-time messages into open panel or refresh conv list
	useEffect(() => {
		let active = true
		const controller = new AbortController()

		const connect = async () => {
			try {
				const res = await fetch('/api/chat/stream', {
					signal: controller.signal,
					cache: 'no-store',
				})
				if (!res.ok || !res.body) return

				const reader = res.body.getReader()
				const decoder = new TextDecoder()
				let buffer = ''

				while (active) {
					const { done, value } = await reader.read()
					if (done) break
					buffer += decoder.decode(value, { stream: true })
					const parts = buffer.split('\n\n')
					buffer = parts.pop() || ''

					for (const part of parts) {
						let eventName = 'message'
						let data = ''
						for (const line of part.split('\n')) {
							if (line.startsWith('event: ')) eventName = line.slice(7).trim()
							if (line.startsWith('data: ')) data = line.slice(6).trim()
						}
						if (!data) continue
						try {
							const parsed = JSON.parse(data)
							if (eventName === 'new_message') {
								// Push into the open panel if it matches
								const push = (window as any).__chatPanelPush
								if (typeof push === 'function' && parsed.conversation_id) {
									setSelected((prev) => {
										if (prev?.id === parsed.conversation_id) {
											push(parsed)
										}
										return prev
									})
								}
								loadConversations()
							}
							if (eventName === 'new_conversation') {
								loadConversations()
							}
						} catch { /* ignore */ }
					}
				}
			} catch (err: any) {
				if (err?.name === 'AbortError') return
				if (active) setTimeout(connect, 5000)
			}
		}

		connect()
		return () => {
			active = false
			controller.abort()
		}
	}, [loadConversations])

	return (
		<div className="border border-gray-200 rounded-xl overflow-hidden" style={{ height: '600px' }}>
			<div className="flex h-full">
				{/* Conversation list */}
				<div className="w-56 sm:w-64 border-r border-gray-200 flex flex-col shrink-0 bg-white">
					<div className="px-4 py-3 border-b border-gray-100">
						<h2 className="font-semibold text-gray-900 text-sm">Conversations</h2>
					</div>
					<div className="flex-1 overflow-y-auto">
						{loading ? (
							<div className="flex items-center justify-center h-24">
								<div className="w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
							</div>
						) : conversations.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-32 px-4 text-center gap-2">
								<p className="text-gray-400 text-sm">No conversations yet.</p>
								<p className="text-gray-300 text-xs">Visit a seller page and tap Chat to start.</p>
							</div>
						) : (
							conversations.map((conv) => (
								<ConvItem
									key={conv.id}
									conv={conv}
									selected={selected?.id === conv.id}
									onClick={() => setSelected(conv)}
								/>
							))
						)}
					</div>
				</div>

				{/* Chat panel */}
				<div className="flex-1 flex min-w-0 bg-gray-50">
					{selected ? (
						<ChatPanel
							key={selected.id}
							conv={selected}
							onNewMessage={() => loadConversations()}
						/>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
							<div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
								<svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
							</div>
							<p className="font-semibold text-gray-900 text-sm">Your Messages</p>
							<p className="text-gray-400 text-sm max-w-[200px]">
								Select a conversation or chat with a seller from their store page.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
