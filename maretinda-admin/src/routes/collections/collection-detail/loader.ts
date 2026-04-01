import { LoaderFunctionArgs } from "react-router-dom"

import { collectionsQueryKeys } from "../../../hooks/api/collections"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const COLLECTION_FIELDS = "id,title,handle,metadata"

const collectionDetailQuery = (id: string) => ({
  queryKey: collectionsQueryKeys.detail(id, { fields: COLLECTION_FIELDS }),
  queryFn: async () => sdk.admin.productCollection.retrieve(id, { fields: COLLECTION_FIELDS }),
})

export const collectionLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = collectionDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
