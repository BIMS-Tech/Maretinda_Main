'use client'

import type { HttpTypes } from '@medusajs/types'
import { useState } from 'react'

import { Button } from '@/components/atoms'
import type { ButtonProps } from '@/components/atoms/Button/Button'
import { ChatBox } from '@/components/cells/ChatBox/ChatBox'
import { Modal } from '@/components/molecules'
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
				<Modal heading="Chat with Seller" onClose={() => setModal(false)}>
					<div className="px-4 pb-4">
						<ChatBox
							sellerId={seller.id}
							sellerName={seller.name}
							subject={chatSubject}
						/>
					</div>
				</Modal>
			)}
		</>
	)
}
