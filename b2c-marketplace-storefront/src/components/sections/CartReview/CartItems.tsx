import { CartItemsHeader, CartItemsProducts } from "@/components/cells"
import { HttpTypes } from "@medusajs/types"

export const CartItems = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  if (!cart) return null

  const groupedItems: any = groupItemsBySeller(cart)

  return Object.keys(groupedItems).map((key) => (
    <div key={key} className="mb-4">
      <CartItemsHeader seller={groupedItems[key]?.seller} />
      <CartItemsProducts
        delete_item={false}
        products={groupedItems[key].items || []}
        currency_code={cart.currency_code}
      />
    </div>
  ))
}

function groupItemsBySeller(cart: HttpTypes.StoreCart) {
  const groupedBySeller: any = {}

  cart.items?.forEach((item: any) => {
    const seller = item.product?.seller
    if (seller) {
      if (!groupedBySeller[seller.id]) {
        groupedBySeller[seller.id] = {
          seller: seller,
          items: [],
        }
      }
      groupedBySeller[seller.id].items.push(item)
    } else {
      if (!groupedBySeller["maretinda"]) {
        groupedBySeller["maretinda"] = {
          seller: {
            name: "Maretinda",
            id: "maretinda",
            photo: "/Logo.png",
            created_at: new Date(),
          },
          items: [],
        }
      }
      groupedBySeller["maretinda"].items.push(item)
    }
  })

  return groupedBySeller
}
