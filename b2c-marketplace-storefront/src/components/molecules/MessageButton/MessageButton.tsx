'use client';

import { useUnreads } from '@talkjs/react';

import { Badge } from '@/components/atoms';
import { MessageIcon2 } from '@/icons';

import LocalizedClientLink from '../LocalizedLink/LocalizedLink';

export const MessageButton = () => {
	const unreads = useUnreads();

	return (
		<LocalizedClientLink
			className="hidden sm:block relative min-w-[30px] sm:pl-2 md:min-w-[35px] xl:min-w-[45px] md:pl-3 xl:pl-4"
			href="/user/messages"
		>
			<MessageIcon2 size={20} />
			{Boolean(unreads?.length) && (
				<Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">
					{unreads?.length}
				</Badge>
			)}
		</LocalizedClientLink>
	);
};
