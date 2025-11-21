import type { Metadata } from 'next';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const metadata: Metadata = {
	description: 'Unauthorized',
	title: '401',
};

export default function Unauthorized() {
	return (
		<div className="flex flex-col gap-8 items-center justify-center py-64 text-[#464647]">
			<h1 className="text-9xl font-bold">401</h1>
			<h2 className="text-[32px] font-medium ">Unauthorized Error</h2>
			<p className="text-xl max-w-[568px] font-normal text-center">
				You're not authorized to view this page. You might need to log
				in to access the page!
			</p>
			<LocalizedClientLink href="/login">
				<Button
					className="border border-black font-medium text-[14px]"
					variant="text"
				>
					Go to Login Page!
				</Button>
			</LocalizedClientLink>
		</div>
	);
}
