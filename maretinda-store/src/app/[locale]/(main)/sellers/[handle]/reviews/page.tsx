import { SellerTabs } from '@/components/organisms';
import { SellerPageHeader } from '@/components/sections';
import { retrieveCustomer } from '@/lib/data/customer';
import { getSellerByHandle } from '@/lib/data/seller';
import type { SellerProps } from '@/types/seller';

export default async function SellerReviewsPage({
	params,
}: {
	params: Promise<{ handle: string; locale: string }>;
}) {
	const { handle, locale } = await params;

	const seller = (await getSellerByHandle(handle)) as SellerProps;

	const user = await retrieveCustomer();

	const tab = 'reviews';

	return (
		<main className="container !max-w-7xl mx-auto">
			<SellerPageHeader header seller={seller} user={user} />
			<SellerTabs locale={locale} seller={seller} tab={tab} />
		</main>
	);
}
