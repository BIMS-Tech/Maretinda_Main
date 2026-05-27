import { SellerTabs } from '@/components/organisms';
import { SellerPageHeader } from '@/components/sections';
import SellerVouchers from '@/components/sections/SellerVouchers/SellerVouchers';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getSellerByHandle } from '@/lib/data/seller';
import { getAvailableVouchers } from '@/lib/data/vouchers';
import type { SellerProps } from '@/types/seller';

export default async function SellerPage({
	params,
}: {
	params: Promise<{ handle: string; locale: string }>;
}) {
	const { handle, locale } = await params;

	const seller = (await getSellerByHandle(handle)) as SellerProps;

	const user = await retrieveCustomer().catch(() => null);

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

	// Fetch this seller's vouchers in parallel with page render
	const sellerVouchers = await getAvailableVouchers(seller.id).catch(() => [])

	return (
		<main className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 lg:py-10">
			<SellerPageHeader seller={seller} user={user} />

			{/* Seller Vouchers Strip — only shown when seller has active vouchers */}
			{sellerVouchers.length > 0 && (
				<div
					className="mt-4 mb-2 px-4 py-3 rounded-2xl border"
					style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
				>
					<SellerVouchers
						vouchers={sellerVouchers}
						isLoggedIn={!!user}
						sellerName={seller.name}
					/>
				</div>
			)}

			<SellerTabs
				currency_code={currency_code}
				locale={locale}
				seller={seller}
				tab={tab}
			/>
		</main>
	);
}
