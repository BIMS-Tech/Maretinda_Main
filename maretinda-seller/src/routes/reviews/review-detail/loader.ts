import { LoaderFunctionArgs } from "react-router-dom"
import { reviewsQueryKeys } from "../../../hooks/api/review"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const reviewDetailQuery = (id: string) => ({
  queryKey: reviewsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/sellers/me/review/${id}`, {
      method: "GET",
      query: { fields: "*customer, reference" },
    }),
})

export const reviewLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = reviewDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
