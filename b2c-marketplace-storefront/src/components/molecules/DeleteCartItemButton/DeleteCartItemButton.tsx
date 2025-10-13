'use client';

import { useState } from 'react';

import { Button } from '@/components/atoms';
import { BinIcon } from '@/icons';
import { deleteLineItem } from '@/lib/data/cart';

export const DeleteCartItemButton = ({ id }: { id: string }) => {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async (id: string) => {
		setIsDeleting(true);
		await deleteLineItem(id).finally(() => {
			setIsDeleting(false);
		});
	};
	return (
		<Button
			className="w-10 h-10 flex items-center justify-center p-0"
			disabled={isDeleting}
			loading={isDeleting}
			onClick={() => handleDelete(id)}
			variant="text"
		>
			<BinIcon size={20} />
		</Button>
	);
};
