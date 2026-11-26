import { useMutation, useQuery } from "@tanstack/react-query"

import { authToken, backendUrl, fetchQuery, publishableApiKey } from "../../lib/client/client"
import { queryClient } from "../../lib/query-client"

export type ReturnCase = {
  request_id: string
  order_id: string
  order_number: number | null
  stage: string
  stage_label: string
  payment: "online" | "cod"
  reasons: { code: string; label: string }[]
  items: { title: string; variant_title: string | null; thumbnail: string | null; unit_price: number; quantity: number; reason: string | null }[]
  evidence: { id: string; kind: "photo" | "video" }[]
  seller_evidence: { id: string; kind: "photo" | "video" }[]
  buyer_note: string | null
  seller_note: string | null
  decision_note: string | null
  resolution: string | null
  respond_by: string
  ship_back_by: string | null
  return_courier: string | null
  return_tracking: string | null
  return_shipping: number | null
  shipped_back_at: string | null
  received_at: string | null
  inspect_by: string | null
  escalated_by: string | null
  decide_by: string | null
  created_at: string
  refund: null | { status: string; amount: number; refunded: { label: string; amount: number }[]; deductions: { label: string; amount: number }[]; seller_charges: { label: string; amount: number }[]; due_by: string; paid_at: string | null; reference: string | null }
}

const KEY = ["vendor", "return-cases"]

export const useReturnCases = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => fetchQuery("/vendor/return-cases", { method: "GET" }) as Promise<{ return_cases: { request_id: string; stage: string; stage_label: string; respond_by: string; ship_back_by: string | null; inspect_by: string | null }[] }>,
  })

export const useReturnCase = (id: string) =>
  useQuery({
    queryKey: [...KEY, id],
    queryFn: () => fetchQuery(`/vendor/return-cases/${id}`, { method: "GET" }) as Promise<{ return_case: ReturnCase }>,
    retry: (count, error: any) => !/not found/i.test(error?.message ?? "") && count < 2,
  })

const done = () => queryClient.invalidateQueries({ queryKey: ["vendor"] })

export const useRespondToReturn = (id: string) =>
  useMutation({
    mutationFn: (body: { action: "accept_return" | "refund_only" | "dispute"; note?: string; evidence?: string[]; instructions?: string }) =>
      fetchQuery(`/vendor/return-cases/${id}/respond`, { method: "POST", body }),
    onSuccess: done,
  })

export const useReturnReceived = (id: string) =>
  useMutation({
    mutationFn: (body: { outcome?: "ok" | "dispute"; note?: string; evidence?: string[] }) =>
      fetchQuery(`/vendor/return-cases/${id}/received`, { method: "POST", body }),
    onSuccess: done,
  })

/** Packing proof for a dispute: one photo or video, kept private. */
export async function uploadReturnProof(file: File): Promise<{ id: string; kind: "photo" | "video"; name: string }> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${backendUrl}/vendor/return-evidence`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken()}`, "x-publishable-api-key": publishableApiKey },
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || "Upload failed. Try again.")
  return { ...json.evidence, name: file.name }
}

/** The buyer's photos and videos need the seller's sign-in, so they are fetched and shown from memory. */
export async function evidenceUrl(id: string): Promise<string> {
  const res = await fetch(`${backendUrl}/vendor/return-evidence/${id}`, {
    headers: { authorization: `Bearer ${authToken()}`, "x-publishable-api-key": publishableApiKey },
  })
  if (!res.ok) throw new Error("Couldn't load this file")
  return URL.createObjectURL(await res.blob())
}
