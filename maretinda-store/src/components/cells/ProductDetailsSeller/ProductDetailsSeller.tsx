import type { HttpTypes } from '@medusajs/types'
import { SellerInfo } from '@/components/molecules'
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink'
import { Chat } from '@/components/organisms/Chat/Chat'
import type { SellerProps } from '@/types/seller'

export const ProductDetailsSeller = ({
	seller,
	user,
	product,
}: {
	seller: SellerProps
	user?: HttpTypes.StoreCustomer | null
	product?: HttpTypes.StoreProduct
}) => {
	if (!seller) return null

	return (
		<div className="rounded-xl border border-black/[0.08] overflow-hidden shadow-sm bg-white">
			<div className="px-4 py-3.5 flex items-center justify-between gap-3">
				<LocalizedClientLink
					href={`/sellers/${seller.handle}/reviews`}
					className="flex-1 min-w-0"
				>
					<SellerInfo seller={seller} />
				</LocalizedClientLink>
				{user && (
					<Chat
						user={user}
						seller={seller}
						product={product}
						icon
						variant="tonal"
						buttonClassNames="shrink-0"
					/>
				)}
			</div>
			<div className="px-4 py-2 bg-[#F7F5FA] border-t border-black/[0.06] flex items-center justify-between">
				{seller.verification_status === 'verified' ? (
					<span
						className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#432C63]"
						title="This seller's business has been verified by Maretinda"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<circle cx="12" cy="12" r="12" opacity="0.12" />
							<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
						</svg>
						Verified Seller
					</span>
				) : (
					<span className="text-[11.5px] font-medium text-black/45">Seller</span>
				)}
				<LocalizedClientLink
					href={`/sellers/${seller.handle}`}
					className="text-[12px] font-semibold text-[#432C63] hover:underline underline-offset-2"
				>
					View Store →
				</LocalizedClientLink>
			</div>
		</div>
	)
}
