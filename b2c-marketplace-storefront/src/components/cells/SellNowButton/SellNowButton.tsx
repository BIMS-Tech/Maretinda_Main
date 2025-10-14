import Link from 'next/link';

import { Button } from '@/components/atoms';

export const SellNowButton = () => {
	return (
		<Link
			href={
				process.env.NEXT_PUBLIC_ALGOLIA_ID === 'UO3C5Y8NHX'
					? 'https://vendor-sandbox.vercel.app/'
					: 'https://vendor.mercurjs.com'
			}
		>
			<Button className="ml-1 min-w-[74px] group font-normal lg:!font-bold text-[10px] lg:text-base px-4 py:2 lg:!py-4 lg:px-6 flex items-center rounded-xs lg:rounded-sm">
				Sell Now
			</Button>
		</Link>
	);
};
