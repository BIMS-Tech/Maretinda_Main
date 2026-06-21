import { useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useBrand } from "../../../hooks/api/admin-brands"
import { BrandGeneralSection } from "./components/brand-general-section"
import { BrandProductSection } from "./components/brand-product-section"

export const BrandDetail = () => {
  const { id } = useParams()
  const { brand, isLoading, isError, error } = useBrand(id!)

  if (isLoading || !brand) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage widgets={{ before: [], after: [] }}>
      <BrandGeneralSection brand={brand} />
      <BrandProductSection brand={brand} />
    </SingleColumnPage>
  )
}
