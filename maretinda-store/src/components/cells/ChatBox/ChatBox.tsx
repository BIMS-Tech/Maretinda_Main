'use client'

import { useEffect, useRef, useState } from 'react'

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

interface ChatConversation {
	id: string
	type: string
	status: string
	subject: string | null
}

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

function formatTime(iso: string): string {
	const d = new Date(iso)
	const now = new Date()
	const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
	if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	if (diffDays === 1) return 'Yesterday'
	return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ChatBox({
	sellerId,
	sellerName,
	subject,
}: {
	sellerId: string
	sellerName: string
	subject?: string
}) {
	const [conv, setConv] = useState<ChatConversation | null>(null)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [input, setInput] = useState('')
	const [sending, setSending] = useState(false)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)

	// Get or create conversation with this vendor then load messages
	useEffect(() => {
		chatFetch<{ conversation: ChatConversation }>('/api/chat', {
			method: 'POST',
			body: JSON.stringify({ vendor_id: sellerId, subject }),
		})
			.then((data) => {
				setConv(data.conversation)
				return chatFetch<{ conversation: ChatConversation; messages: ChatMessage[]; count: number }>(
					`/api/chat/${data.conversation.id}`
				)
			})
			.then((data) => {
				setMessages(data.messages)
				setLoading(false)
				fetch(`/api/chat/${data.conversation.id}/read`, { method: 'POST' }).catch(() => {})
			})
			.catch((err) => {
				setError(err.message || 'Could not connect to chat.')
				setLoading(false)
			})
	}, [sellerId, subject])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	const handleSend = async () => {
		if (!conv || !input.trim() || sending) return
		const trimmed = input.trim()
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
		} catch {
			setInput(trimmed)
		} finally {
			setSending(false)
		}
	}

	if (loading) {
		return (
			<div className="w-full h-64 flex items-center justify-center">
				<div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="w-full h-32 flex items-center justify-center">
				<p className="text-sm text-red-500">{error}</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col" style={{ height: '480px' }}>
			{/* Seller info header */}
			<div className="py-2 pb-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
				<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
					<span className="text-xs font-bold text-gray-600">{sellerName.charAt(0).toUpperCase()}</span>
				</div>
				<div>
					<p className="text-sm font-semibold text-gray-900">{sellerName}</p>
					{conv?.subject && <p className="text-xs text-gray-400">{conv.subject}</p>}
				</div>
				{conv?.status === 'closed' && (
					<span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Closed</span>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto py-3 space-y-3">
				{messages.length === 0 ? (
					<div className="h-full flex items-center justify-center">
						<p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
					</div>
				) : (
					messages.map((msg) => {
						const isOwn = msg.sender_role === 'customer'
						const isAdmin = msg.sender_role === 'admin'
						return (
							<div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
								<div className={`max-w-[80%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
									{!isOwn && (
										<span className={`text-xs mb-1 font-medium ${isAdmin ? 'text-orange-600' : 'text-gray-500'}`}>
											{isAdmin ? 'Support' : msg.sender_name}
										</span>
									)}
									<div
										className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
											isOwn
												? 'bg-black text-white rounded-tr-sm'
												: isAdmin
												? 'bg-orange-50 text-orange-900 border border-orange-200 rounded-tl-sm'
												: 'bg-gray-100 text-gray-900 rounded-tl-sm'
										}`}
									>
										{msg.body}
									</div>
									<span className="text-gray-400 text-xs mt-0.5">{formatTime(msg.created_at)}</span>
								</div>
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			{conv?.status !== 'closed' && (
				<div className="border-t border-gray-100 pt-3 flex gap-2 shrink-0">
					<input
						className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-400"
						placeholder={`Message ${sellerName}…`}
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
