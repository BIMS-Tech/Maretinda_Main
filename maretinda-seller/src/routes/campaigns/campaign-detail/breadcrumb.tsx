import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { useCampaign } from "../../../hooks/api"

type CampaignDetailBreadcrumbProps = UIMatch<HttpTypes.AdminCampaignResponse>

export const CampaignDetailBreadcrumb = (
  props: CampaignDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { campaign } = useCampaign(
    id!,
    undefined,
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!campaign) {
    return null
  }

  return <span>{campaign.name}</span>
}
