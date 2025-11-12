'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import type { ButtonProps } from '@/components/atoms/Button/Button';
import { ChatBox } from '@/components/cells/ChatBox/ChatBox';
import { Modal } from '@/components/molecules';
import { MessageIcon } from '@/icons';
import type { SellerProps } from '@/types/seller';

const TALKJS_APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID || '';

export const Chat = ({
	user,
	seller,
	buttonClassNames,
	icon,
	product,
	subject,
	order_id,
	variant = 'tonal',
}: {
	user: HttpTypes.StoreCustomer | null;
	seller: SellerProps;
	buttonClassNames?: string;
	icon?: boolean;
	product?: HttpTypes.StoreProduct;
	subject?: string;
	order_id?: string;
	variant?: ButtonProps['variant'];
}) => {
	const [modal, setModal] = useState(false);

	if (!TALKJS_APP_ID) {
		return null;
	}

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
				<Modal heading="Chat" onClose={() => setModal(false)}>
					<div className="px-4">
						<ChatBox
							currentUser={{
								email: user?.email || null,
								id: user?.id || '',
								name:
									`${user?.first_name} ${user?.last_name}` ||
									'',
								photoUrl: '/talkjs-placeholder.jpg',
								role: 'customer',
							}}
							order_id={order_id}
							product_id={product?.id}
							subject={subject || product?.title || null}
							supportUser={{
								email: seller?.email || null,
								id: seller?.id || '',
								name: seller?.name || '',
								photoUrl:
									seller.photo || '/talkjs-placeholder.jpg',
								role: 'seller',
							}}
						/>
					</div>
				</Modal>
			)}
		</>
	);
};
