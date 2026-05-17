import { SellerTabs } from '@/components/organisms';
import { SellerPageHeader } from '@/components/sections';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getSellerByHandle } from '@/lib/data/seller';
import type { SellerProps } from '@/types/seller';

export default async function SellerPage({
	params,
}: {
	params: Promise<{ handle: string; locale: string }>;
}) {
	const { handle, locale } = await params;

	const seller = (await getSellerByHandle(handle)) as SellerProps;

	const user = await retrieveCustomer();

	const currency_code = (await getRegion(locale))?.currency_code || 'usd';

	const tab = 'products';

	if (!seller || !seller.id) {
		return (
			<main className="max-w-[1360px] mx-auto px-4 lg:px-6 py-16 text-center">
				<div className="text-[40px] mb-4">🏪</div>
				<h2 className="font-serif text-[28px] text-[#1B1B1B] mb-2">Shop not found</h2>
				<p className="text-[14px]" style={{ color: '#737373' }}>This vendor shop doesn't exist or is no longer available.</p>
			</main>
		);
	}

	return (
		<main className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 lg:py-10">
			<SellerPageHeader seller={seller} user={user} />
			<SellerTabs
				currency_code={currency_code}
				locale={locale}
				seller={seller}
				tab={tab}
			/>
		</main>
	);
}
