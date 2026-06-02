'use client'

import type { HttpTypes } from '@medusajs/types'
import { useState } from 'react'

import { Button } from '@/components/atoms'
import type { ButtonProps } from '@/components/atoms/Button/Button'
import { ChatBox } from '@/components/cells/ChatBox/ChatBox'
import { MessageIcon } from '@/icons'
import type { SellerProps } from '@/types/seller'

export const Chat = ({
	user,
	seller,
	buttonClassNames,
	icon,
	product,
	subject,
	variant = 'tonal',
}: {
	user: HttpTypes.StoreCustomer | null
	seller: SellerProps
	buttonClassNames?: string
	icon?: boolean
	product?: HttpTypes.StoreProduct
	subject?: string
	order_id?: string
	variant?: ButtonProps['variant']
}) => {
	const [modal, setModal] = useState(false)

	if (!user) return null

	const chatSubject = subject || product?.title || undefined

	return (
		<>
			<Button
				className={buttonClassNames}
				onClick={() => setModal(true)}
				variant={variant}
			>
				{icon ? <MessageIcon size={20} /> : 'Write to Seller'}
			</Button>

			{modal && (
				<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setModal(false)}
					/>
					{/* Chat window */}
					<div
						className="relative z-10 w-full sm:max-w-[420px] mx-0 sm:mx-4 sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
						style={{ height: '580px', maxHeight: '95vh' }}
					>
						<ChatBox
							sellerId={seller.id}
							sellerName={seller.name}
							subject={chatSubject}
							onClose={() => setModal(false)}
						/>
					</div>
				</div>
			)}
		</>
	)
}
