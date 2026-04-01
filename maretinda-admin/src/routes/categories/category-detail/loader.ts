import { LoaderFunctionArgs } from "react-router-dom"

import { categoriesQueryKeys } from "../../../hooks/api/categories"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const CATEGORY_FIELDS =
  "id,name,handle,description,is_active,is_internal,rank,metadata,parent_category_id"

const categoryDetailQuery = (id: string) => ({
  queryKey: categoriesQueryKeys.detail(id, { fields: CATEGORY_FIELDS }),
  queryFn: async () =>
    sdk.admin.productCategory.retrieve(id, {
      fields: CATEGORY_FIELDS,
    }),
})

export const categoryLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = categoryDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
