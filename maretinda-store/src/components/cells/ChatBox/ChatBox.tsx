'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageIcon } from '@/icons'

const EMOJIS = [
	'😊','😂','❤️','👍','🙏','😍','🎉','😭','🔥','✨',
	'😅','🤔','👀','💯','🥰','😎','🤝','💪','😢','🙌',
	'👋','😁','🤣','💙','✅','⭐','🎁','🌟','💬','📦',
	'🏷️','🛒','💰','📸','🚀','⚡','🌈','💡','🎯','🤩',
]

interface ChatMessage {
	id: string
	conversation_id: string
	sender_id: string
	sender_role: 'seller' | 'customer' | 'admin'
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

function SendIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export function ChatBox({
	sellerId,
	sellerName,
	subject,
	onClose,
}: {
	sellerId: string
	sellerName: string
	subject?: string
	onClose?: () => void
}) {
	const [conv, setConv] = useState<ChatConversation | null>(null)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [input, setInput] = useState('')
	const [sending, setSending] = useState(false)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showEmoji, setShowEmoji] = useState(false)
	const bottomRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		chatFetch<{ conversation: ChatConversation }>('/api/chat', {
			method: 'POST',
			body: JSON.stringify({ seller_id: sellerId, subject }),
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

	const initials = sellerName
		.split(' ')
		.slice(0, 2)
		.map((w) => w.charAt(0).toUpperCase())
		.join('')

	return (
		<div className="flex flex-col h-full bg-white">
			{/* ── Header ─────────────────────────────────────────── */}
			<div
				className="flex items-center gap-3 px-5 py-4 shrink-0"
				style={{ background: 'linear-gradient(135deg, #372248 0%, #5c3882 100%)' }}
			>
				<div className="w-10 h-10 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center shrink-0">
					<span className="text-sm font-bold text-white">{initials}</span>
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-white font-semibold text-sm leading-tight truncate">{sellerName}</p>
					<div className="flex items-center gap-1.5 mt-0.5">
						<span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
						<span className="text-white/70 text-xs">Online</span>
					</div>
				</div>
				{conv?.status === 'closed' && (
					<span className="text-xs bg-white/20 text-white/80 px-2.5 py-1 rounded-full">Closed</span>
				)}
				{onClose && (
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
							<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
						</svg>
					</button>
				)}
			</div>

			{/* ── Subject strip ──────────────────────────────────── */}
			{conv?.subject && (
				<div className="px-5 py-2 bg-[#fdf2ff] border-b border-purple-100 shrink-0">
					<p className="text-xs text-gray-500 truncate">
						<span className="font-medium text-gray-600">Topic:</span> {conv.subject}
					</p>
				</div>
			)}

			{/* ── Messages ───────────────────────────────────────── */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f7f5fa]">
				{loading ? (
					<div className="h-full flex items-center justify-center">
						<div className="w-7 h-7 border-2 border-purple-200 border-t-[#372248] rounded-full animate-spin" />
					</div>
				) : error ? (
					<div className="h-full flex items-center justify-center px-6">
						<p className="text-sm text-red-500 text-center">{error}</p>
					</div>
				) : messages.length === 0 ? (
					<div className="h-full flex flex-col items-center justify-center gap-3 py-10">
						<div className="w-14 h-14 rounded-full bg-[#fdf2ff] flex items-center justify-center">
							<MessageIcon size={24} color="#9B80D2" />
						</div>
						<div className="text-center">
							<p className="text-sm font-medium text-gray-700">Start the conversation</p>
							<p className="text-xs text-gray-400 mt-1">Send a message to {sellerName}</p>
						</div>
					</div>
				) : (
					messages.map((msg) => {
						const isOwn = msg.sender_role === 'customer'
						const isAdmin = msg.sender_role === 'admin'
						const senderInitial = msg.sender_name.charAt(0).toUpperCase()

						return (
							<div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
								{!isOwn && (
									<div className="w-7 h-7 rounded-full bg-[#5c3882] flex items-center justify-center shrink-0">
										<span className="text-[10px] font-bold text-white">{senderInitial}</span>
									</div>
								)}
								<div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
									{!isOwn && (
										<span className={`text-[11px] font-medium mb-1 ${isAdmin ? 'text-orange-500' : 'text-gray-500'}`}>
											{isAdmin ? 'Support' : msg.sender_name}
										</span>
									)}
									<div
										className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words leading-relaxed shadow-sm ${
											isOwn
												? 'text-white rounded-br-none'
												: isAdmin
												? 'bg-orange-50 text-orange-900 border border-orange-200 rounded-bl-none'
												: 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
										}`}
										style={isOwn ? { background: 'linear-gradient(135deg, #372248 0%, #5c3882 100%)' } : undefined}
									>
										{msg.body}
									</div>
									<span className="text-gray-400 text-[11px] mt-1 px-1">{formatTime(msg.created_at)}</span>
								</div>
							</div>
						)
					})
				)}
				<div ref={bottomRef} />
			</div>

			{/* ── Input ──────────────────────────────────────────── */}
			{conv?.status !== 'closed' ? (
				<div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0 relative">
					{showEmoji && (
						<div className="absolute bottom-16 left-4 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20 w-64">
							<div className="grid grid-cols-10 gap-1">
								{EMOJIS.map((e) => (
									<button
										key={e}
										type="button"
										onClick={() => {
											setInput((prev) => prev + e)
											setShowEmoji(false)
											inputRef.current?.focus()
										}}
										className="text-lg hover:bg-gray-100 rounded p-0.5 transition-colors leading-none"
									>
										{e}
									</button>
								))}
							</div>
						</div>
					)}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setShowEmoji((v) => !v)}
							className="text-gray-400 hover:text-[#5c3882] transition-colors text-lg leading-none shrink-0"
						>
							😊
						</button>
						<input
							ref={inputRef}
							className="flex-1 bg-[#f7f5fa] border border-transparent rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-purple-300 focus:bg-white transition-all placeholder-gray-400"
							placeholder={`Message ${sellerName}…`}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
								if (e.key === 'Escape') setShowEmoji(false)
							}}
						/>
						<button
							onClick={handleSend}
							disabled={sending || !input.trim()}
							className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shrink-0 active:scale-95 disabled:opacity-40"
							style={{ background: 'linear-gradient(135deg, #372248 0%, #5c3882 100%)' }}
						>
							{sending ? (
								<div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
							) : (
								<SendIcon />
							)}
						</button>
					</div>
				</div>
			) : (
				<div className="bg-gray-50 border-t border-gray-100 px-4 py-3 text-center shrink-0">
					<span className="text-xs text-gray-400">This conversation is closed</span>
				</div>
			)}
		</div>
	)
}
