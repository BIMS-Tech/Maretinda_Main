import Link from 'next/link';

import { Button } from '@/components/atoms';

export const SellNowButton = () => {
	return (
		<Link href="https://testvendor.maretinda.com">
			<Button className="ml-1 min-w-[74px] lg:min-w-[100px] group !font-medium text-md px-4 py:2 lg:!py-2.5 lg:px-5 flex items-center rounded-xs lg:rounded-sm">
				Sell Now
			</Button>
		</Link>
	);
};
