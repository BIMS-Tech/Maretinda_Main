import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /vendor/3d-models/tasks/:taskId
 *
 * Polls the status of a 3D model generation task.
 * If the task is still processing, syncs with Meshy.ai and updates the DB.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const member = await pg("member").where("id", memberId).first()
    if (!member?.seller_id) {
      res.status(403).json({ message: "Not a seller" })
      return
    }

    const { taskId } = req.params as { taskId: string }

    const model = await pg("product_3d_model")
      .where("id", taskId)
      .where("seller_id", member.seller_id)
      .first()

    if (!model) {
      res.status(404).json({ message: "Model task not found" })
      return
    }

    // Already in a terminal state — return cached result
    if (model.status === "completed" || model.status === "failed") {
      res.status(200).json({ model })
      return
    }

    const meshyApiKey = process.env.MESHY_API_KEY
    if (!meshyApiKey) {
      res.status(200).json({ model })
      return
    }

    // Sync with Meshy.ai
    const meshyRes = await fetch(
      `https://api.meshy.ai/openapi/v1/image-to-3d/${model.provider_task_id}`,
      { headers: { Authorization: `Bearer ${meshyApiKey}` } }
    )

    if (!meshyRes.ok) {
      // Return current DB state without crashing
      res.status(200).json({ model })
      return
    }

    const meshyData = (await meshyRes.json()) as {
      id: string
      status: string
      progress: number
      model_urls?: { glb?: string; fbx?: string; obj?: string }
      thumbnail_url?: string
      task_error?: { message: string }
    }

    let newStatus = model.status as string
    let modelUrl: string | null = model.model_url
    let thumbnailUrl: string | null = model.thumbnail_url
    let progress: number = meshyData.progress ?? model.progress
    let errorMessage: string | null = model.error_message

    if (meshyData.status === "SUCCEEDED") {
      newStatus = "completed"
      modelUrl = meshyData.model_urls?.glb ?? null
      thumbnailUrl = meshyData.thumbnail_url ?? null
      progress = 100
    } else if (meshyData.status === "FAILED" || meshyData.status === "EXPIRED") {
      newStatus = "failed"
      errorMessage = meshyData.task_error?.message ?? "Generation failed"
      progress = 0
    }

    if (newStatus !== model.status || progress !== model.progress) {
      await pg("product_3d_model").where("id", taskId).update({
        status: newStatus,
        model_url: modelUrl,
        thumbnail_url: thumbnailUrl,
        progress,
        error_message: errorMessage,
        updated_at: new Date(),
      })
    }

    res.status(200).json({
      model: {
        ...model,
        status: newStatus,
        model_url: modelUrl,
        thumbnail_url: thumbnailUrl,
        progress,
        error_message: errorMessage,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get task status" })
  }
}
