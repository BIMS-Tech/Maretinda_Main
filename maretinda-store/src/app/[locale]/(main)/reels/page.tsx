import { ReelsGallery } from '@/components/organisms/Reels/ReelsGallery';
import { retrieveCustomer } from '@/lib/data/customer';
import { listReels } from '@/lib/data/reels';

export const metadata = {
	title: 'Reels',
	description: 'Short videos from sellers on Maretinda',
};

export default async function ReelsPage() {
	const [{ reels }, user] = await Promise.all([
		listReels({ limit: 40 }),
		retrieveCustomer().catch(() => null),
	]);

	return (
		<main className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 lg:py-10">
			<h1 className="font-serif text-[28px] lg:text-[34px] text-[#1B1B1B]">Reels</h1>
			<p className="text-[14px] mt-1 mb-6" style={{ color: '#737373' }}>
				Short videos from sellers — like, comment, or message the shop directly
			</p>

			<ReelsGallery reels={reels} showSeller user={user} />
		</main>
	);
}
