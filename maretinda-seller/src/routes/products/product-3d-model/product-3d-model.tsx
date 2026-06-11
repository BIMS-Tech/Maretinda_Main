import { useParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { useProduct } from "../../../hooks/api/products"
import { Product3DModelView } from "./components/product-3d-model-view"

export const Product3DModel = () => {
  const { id } = useParams()
  const { product, isLoading, isError, error } = useProduct(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">3D Model Generator</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">Generate AI-powered 3D models for your product</span>
      </RouteFocusModal.Description>
      {!isLoading && product && (
        <RouteFocusModal.Body className="overflow-y-auto">
          <Product3DModelView product={product} />
        </RouteFocusModal.Body>
      )}
    </RouteFocusModal>
  )
}
