'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/atoms'
import { MessageIcon2 } from '@/icons'
import { NavText } from '@/i18n/NavText'

import LocalizedClientLink from '../LocalizedLink/LocalizedLink'

export const MessageButton = () => {
	const [unread, setUnread] = useState(0)

	useEffect(() => {
		fetch('/api/chat')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data?.unread) setUnread(Number(data.unread))
			})
			.catch(() => {})
	}, [])

	return (
		<LocalizedClientLink
			className="relative flex flex-col items-center justify-center px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors"
			href="/user/messages"
		>
			<span className="relative">
				<MessageIcon2 size={22} color="white" />
				{unread > 0 && (
					<Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">{unread}</Badge>
				)}
			</span>
			<span className="text-[11px] text-white/80 hidden sm:block leading-none"><NavText k="messages" /></span>
		</LocalizedClientLink>
	)
}
