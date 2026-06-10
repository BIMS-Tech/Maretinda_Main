import type { HttpTypes } from '@medusajs/types'
import { Avatar } from '@/components/atoms'
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
		<div className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-[#FDFCFE] px-4 py-3.5">
			<LocalizedClientLink href={`/sellers/${seller.handle}/reviews`} className="flex items-center gap-3 min-w-0 flex-1">
				<Avatar
					className="rounded-full h-10 w-10 flex-shrink-0 ring-2 ring-[#432C63]/10"
					initials={seller.name?.[0]?.toUpperCase() ?? 'S'}
					size="large"
					src={seller.photo || '/talkjs-placeholder.jpg'}
				/>
				<div className="min-w-0">
					<div className="flex items-center gap-1.5">
						<span className="text-[13.5px] font-semibold text-[#1B1B1B] truncate">
							{seller.name}
						</span>
						<span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#432C63]/10 text-[#432C63]">
							Seller
						</span>
					</div>
					<span className="text-[11px] text-gray-400">View store →</span>
				</div>
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
	)
}
