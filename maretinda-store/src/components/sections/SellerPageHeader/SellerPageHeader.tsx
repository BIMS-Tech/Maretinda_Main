import type { HttpTypes } from '@medusajs/types';
import { format } from 'date-fns';
import Image from 'next/image';

import type { SellerProps } from '@/types/seller';

import { Chat } from '../../organisms/Chat/Chat';

const BANNER_COLORS = ['#E8DEF7', '#E2D9C7', '#D9EAE2', '#F2D9E2', '#D9E5F0', '#F0E4CC', '#FFE2D2', '#D8EAD9'];
const AVATAR_COLORS = ['#9B80D2', '#D9CFB8', '#5FA88B', '#D98AA1', '#7FA8C9', '#E8B87A', '#E26D5C', '#6BBF8A'];
const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';

const VerifiedBadge = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="#7FA8C9">
		<circle cx="12" cy="12" r="12" />
		<path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" fill="none" />
	</svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
	<svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? '#FFC533' : '#E0E0E0'}>
		<path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
	</svg>
);

function getColorIndex(id: string) {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
	return Math.abs(hash) % BANNER_COLORS.length;
}

export const SellerPageHeader = ({
	seller,
	user,
}: {
	header?: boolean;
	seller: SellerProps;
	user: HttpTypes.StoreCustomer | null;
}) => {
	const colorIdx = getColorIndex(seller.id);
	const bannerBg = BANNER_COLORS[colorIdx];
	const avatarBg = AVATAR_COLORS[colorIdx];

	const reviews = seller.reviews?.filter((r) => r !== null) ?? [];
	const reviewCount = reviews.length;
	const rating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviewCount : 0;
	const ratingRounded = Math.round(rating * 10) / 10;

	return (
		<div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#EDEAE3' }}>
			{/* Banner */}
			<div
				className="h-36 lg:h-48 w-full"
				style={{ backgroundColor: bannerBg, backgroundImage: STRIPE }}
			/>

			{/* Body */}
			<div className="bg-white px-6 lg:px-8 pb-6">
				<div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
					{/* Avatar */}
					<div
						className="w-20 h-20 rounded-full border-4 border-white overflow-hidden flex-shrink-0"
						style={{ backgroundColor: avatarBg, boxShadow: '0 2px 8px rgba(20,20,20,0.08)' }}
					>
						{seller.photo ? (
							<Image
								src={seller.photo}
								alt={seller.name}
								width={80}
								height={80}
								className="w-full h-full object-cover"
							/>
						) : (
							<div
								className="w-full h-full flex items-center justify-center text-white font-extrabold text-[28px]"
								style={{ backgroundColor: avatarBg, backgroundImage: STRIPE }}
							>
								{seller.name.charAt(0).toUpperCase()}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2 pb-1">
						{user && (
							<Chat
								buttonClassNames="h-10 px-4 rounded-full text-[13px] font-bold border flex items-center gap-2"
								icon
								seller={seller}
								user={user}
								variant="filled"
							/>
						)}
					</div>
				</div>

				{/* Name + verified */}
				<div className="flex items-center gap-2 mb-1">
					<h1 className="text-[22px] font-extrabold text-[#1B1B1B]">{seller.name}</h1>
					{seller.verification_status === 'verified' && <VerifiedBadge />}
				</div>

				{/* Rating */}
				{reviewCount > 0 && (
					<div className="flex items-center gap-1.5 mb-2">
						<div className="flex items-center gap-0.5">
							{[1, 2, 3, 4, 5].map((star) => (
								<StarIcon key={star} filled={star <= Math.round(rating)} />
							))}
						</div>
						<span className="text-[13px] font-bold text-[#1B1B1B]">{ratingRounded}</span>
						<span className="text-[12.5px] text-[#737373]">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
					</div>
				)}

				{/* Description */}
				{seller.description && (
					<p
						className="text-[13.5px] mb-3 max-w-[600px]"
						style={{ color: '#404040' }}
						dangerouslySetInnerHTML={{ __html: seller.description }}
					/>
				)}

				{/* Meta */}
				<div className="flex items-center gap-3 flex-wrap text-[12px]" style={{ color: '#737373' }}>
					{seller.store_status === 'ACTIVE' && (
						<span className="flex items-center gap-1">
							<span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#5FA88B' }} />
							Active seller
						</span>
					)}
					{seller.created_at && (
						<span>Joined {format(seller.created_at, 'MMMM yyyy')}</span>
					)}
					{seller.city && seller.country_code && (
						<span>{seller.city}, {seller.country_code.toUpperCase()}</span>
					)}
				</div>
			</div>
		</div>
	);
};
