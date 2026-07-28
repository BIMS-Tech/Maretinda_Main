import { ReelsGallery } from '@/components/organisms/Reels/ReelsGallery';
import { retrieveCustomer } from '@/lib/data/customer';
import { listReels } from '@/lib/data/reels';

/**
 * Server-rendered reels shelf. Drop it on a seller page (pass `seller_id`) or
 * anywhere a cross-shop feed makes sense (omit it). Renders nothing when the
 * feed is empty so it can be added to a page unconditionally.
 */
export const ReelsSection = async ({
	seller_id,
	limit = 10,
	heading = 'Reels',
	subheading,
	viewAllHref,
	showSeller,
	hideWhenEmpty = true,
}: {
	seller_id?: string;
	limit?: number;
	heading?: string;
	subheading?: string;
	viewAllHref?: string;
	showSeller?: boolean;
	hideWhenEmpty?: boolean;
}) => {
	const [{ reels }, user] = await Promise.all([
		listReels({ seller_id, limit }),
		retrieveCustomer().catch(() => null),
	]);

	if (!reels.length && hideWhenEmpty) return null;

	return (
		<section className="mt-8">
			<div className="flex items-end justify-between mb-4">
				<div>
					<h2 className="font-serif text-[22px] lg:text-[26px] text-[#1B1B1B]">
						{heading}
					</h2>
					{subheading && (
						<p className="text-[13px] mt-0.5" style={{ color: '#737373' }}>
							{subheading}
						</p>
					)}
				</div>

				{viewAllHref && (
					<a
						className="text-[13px] font-semibold hover:underline"
						href={viewAllHref}
						style={{ color: '#432C63' }}
					>
						See all
					</a>
				)}
			</div>

			<ReelsGallery reels={reels} showSeller={showSeller} user={user} />
		</section>
	);
};
