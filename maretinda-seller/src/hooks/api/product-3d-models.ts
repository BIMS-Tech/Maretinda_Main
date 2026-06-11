import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

export interface Product3DModel {
  id: string
  product_id: string
  seller_id: string
  status: "processing" | "completed" | "failed"
  source_image_url: string
  model_url: string | null
  thumbnail_url: string | null
  provider: string
  provider_task_id: string
  error_message: string | null
  progress: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export const product3DModelKeys = {
  all: ["product-3d-models"] as const,
  byProduct: (productId: string) => ["product-3d-models", "product", productId] as const,
  task: (taskId: string) => ["product-3d-models", "task", taskId] as const,
}

export const useProduct3DModels = (productId: string) => {
  return useQuery<{ models: Product3DModel[] }>({
    queryKey: product3DModelKeys.byProduct(productId),
    queryFn: () =>
      fetchQuery(`/vendor/3d-models/products/${productId}`, { method: "GET" }),
    enabled: !!productId,
    staleTime: 1000 * 30,
  })
}

export const useProduct3DModelTask = (taskId: string | null, enabled: boolean) => {
  return useQuery<{ model: Product3DModel }>({
    queryKey: product3DModelKeys.task(taskId ?? ""),
    queryFn: () => fetchQuery(`/vendor/3d-models/tasks/${taskId}`, { method: "GET" }),
    enabled: !!taskId && enabled,
    refetchInterval: (query) => {
      const model = query.state.data?.model
      if (!model) return 5000
      return model.status === "processing" ? 5000 : false
    },
  })
}

export const useGenerate3DModel = (productId: string) => {
  const qc = useQueryClient()
  return useMutation<
    { model: Product3DModel },
    Error,
    { product_id: string; image_url: string }
  >({
    mutationFn: (payload) =>
      fetchQuery("/vendor/3d-models/generate", { method: "POST", body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: product3DModelKeys.byProduct(productId) })
    },
  })
}

export const useDelete3DModel = (productId: string) => {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (modelId) =>
      fetchQuery(`/vendor/3d-models/${modelId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: product3DModelKeys.byProduct(productId) })
    },
  })
}

export const useSetPrimary3DModel = (productId: string) => {
  const qc = useQueryClient()
  return useMutation<{ model: Product3DModel }, Error, string>({
    mutationFn: (modelId) =>
      fetchQuery(`/vendor/3d-models/${modelId}/set-primary`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: product3DModelKeys.byProduct(productId) })
    },
  })
}
