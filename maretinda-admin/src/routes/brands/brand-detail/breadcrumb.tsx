import { UIMatch } from "react-router-dom"
import { useBrand } from "../../../hooks/api/admin-brands"

export const BrandDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}
  const { brand } = useBrand(id!, { enabled: Boolean(id) })

  if (!brand) {
    return null
  }

  return <span>{brand.name}</span>
}
