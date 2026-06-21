import { Heading } from "@medusajs/ui"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useBrand } from "../../../hooks/api/admin-brands"
import { BrandEditForm } from "./components/brand-edit-form"

export const BrandEdit = () => {
  const { id } = useParams()
  const { brand, isLoading, isError, error } = useBrand(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>Edit Brand</Heading>
      </RouteDrawer.Header>
      {!isLoading && brand && <BrandEditForm brand={brand} />}
    </RouteDrawer>
  )
}
