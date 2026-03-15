import imagesConverter from "./images-conventer"
import { HttpTypes } from "@medusajs/types"

export default function productsImagesFormatter(
  products: HttpTypes.AdminProduct[] | HttpTypes.AdminProduct | undefined
) {
  if (!products) return null

  if (Array.isArray(products)) {
    return products.map((product: HttpTypes.AdminProduct) => ({
      ...product,
      thumbnail: imagesConverter(product.thumbnail || ""),
      images: product.images?.map((image: any) => ({
        ...image,
        url: imagesConverter(image.url || ""),
      })),
    }))
  }

  return {
    ...products,
    thumbnail: imagesConverter(products.thumbnail || ""),
    images: products.images?.map((image: any) => ({
      ...image,
      url: imagesConverter(image.url || ""),
    })),
  }
}
