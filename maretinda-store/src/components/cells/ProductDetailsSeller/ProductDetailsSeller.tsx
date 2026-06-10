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
		<div className="bg-[#fafafa] border rounded-sm shadow-sm">
			<div className="p-4 flex items-center justify-between gap-3">
				<LocalizedClientLink href={`/sellers/${seller.handle}/reviews`} className="flex-1 min-w-0">
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
		</div>
	)
}
