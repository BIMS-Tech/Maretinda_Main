import { useParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { useBrand } from "../../../hooks/api/admin-brands"
import { AddProductsToBrandForm } from "./components/add-products-to-brand-form"

export const BrandAddProducts = () => {
  const { id } = useParams()
  const { brand, isLoading, isError, error } = useBrand(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {!isLoading && brand && <AddProductsToBrandForm brand={brand} />}
    </RouteFocusModal>
  )
}
