import { SingleColumnPage } from "../../../components/layout/pages"
import { BrandListTable } from "./components/brand-list-table"

export const BrandList = () => {
  return (
    <SingleColumnPage widgets={{ before: [], after: [] }}>
      <BrandListTable />
    </SingleColumnPage>
  )
}
