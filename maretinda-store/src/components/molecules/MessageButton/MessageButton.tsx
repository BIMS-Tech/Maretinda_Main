'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/atoms'
import { MessageIcon2 } from '@/icons'

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
			className="hidden sm:block relative min-w-[30px] sm:pl-2 md:min-w-[35px] xl:min-w-[45px] md:pl-3 xl:pl-4"
			href="/user/messages"
		>
			<MessageIcon2 size={20} />
			{unread > 0 && (
				<Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">{unread}</Badge>
			)}
		</LocalizedClientLink>
	)
}
