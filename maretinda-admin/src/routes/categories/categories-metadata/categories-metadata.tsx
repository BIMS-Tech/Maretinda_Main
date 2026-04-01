import { useParams } from "react-router-dom"

import {
  useProductCategory,
  useUpdateProductCategory,
} from "../../../hooks/api"
import { MetadataForm } from "../../../components/forms/metadata-form"
import { RouteDrawer } from "../../../components/modals"

export const CategoriesMetadata = () => {
  const { id } = useParams()

  const { product_category, isPending, isError, error } = useProductCategory(
    id!,
    { fields: "id,metadata" }
  )
  const { mutateAsync, isPending: isMutating } = useUpdateProductCategory(id!)

  if (isError) {
    throw error
  }

  const hook = (
    params: { metadata?: Record<string, any> | null },
    callbacks: { onSuccess: () => void; onError: (error: any) => void }
  ) => mutateAsync({ metadata: params.metadata ?? undefined }, callbacks)

  return (
    <RouteDrawer>
      <MetadataForm
        isPending={isPending}
        isMutating={isMutating}
        hook={hook}
        metadata={product_category?.metadata}
      />
    </RouteDrawer>
  )
}
