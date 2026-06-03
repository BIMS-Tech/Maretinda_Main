import { LoaderFunctionArgs } from "react-router-dom"

import { campaignsQueryKeys } from "../../../hooks/api/campaigns"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const campaignDetailQuery = (id: string) => ({
  queryKey: campaignsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/campaigns/${id}`, {
      method: "GET",
    }),
})

export const campaignLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = campaignDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
