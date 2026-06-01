import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { backendUrl, sdk } from "../../lib/client/client"

export interface ChatConversation {
  id: string
  type: string
  vendor_id: string | null
  customer_id: string | null
  subject: string | null
  status: string
  last_message_at: string | null
  unread_vendor: number
  unread_customer: number
  unread_admin: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: "vendor" | "customer" | "admin"
  sender_name: string
  body: string
  read_at: string | null
  created_at: string
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem("medusa_admin_jwt")
  const res = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(err.message)
  }
  return res.json()
}

export const useChatConversations = (params?: { limit?: number; offset?: number }) => {
  const query = new URLSearchParams()
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.offset) query.set("offset", String(params.offset))

  return useQuery<{ conversations: ChatConversation[]; count: number; unread: number }>({
    queryKey: ["admin-chat-conversations", params],
    queryFn: () => adminFetch(`/admin/chat${query.toString() ? `?${query}` : ""}`),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  })
}

export const useChatMessages = (conversationId: string | null) => {
  return useQuery<{ conversation: ChatConversation; messages: ChatMessage[]; count: number }>({
    queryKey: ["admin-chat-messages", conversationId],
    queryFn: () => adminFetch(`/admin/chat/${conversationId}`),
    enabled: !!conversationId,
    staleTime: 0,
  })
}

export const useSendMessage = (conversationId: string) => {
  const qc = useQueryClient()
  return useMutation<{ message: ChatMessage }, Error, { body: string }>({
    mutationFn: (payload) =>
      adminFetch(`/admin/chat/${conversationId}/message`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chat-messages", conversationId] })
      qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
    },
  })
}

export const useCreateConversation = () => {
  const qc = useQueryClient()
  return useMutation<
    { conversation: ChatConversation },
    Error,
    { vendor_id?: string; customer_id?: string; subject?: string; type?: string }
  >({
    mutationFn: (payload) =>
      adminFetch("/admin/chat", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
    },
  })
}

export const useCloseConversation = () => {
  const qc = useQueryClient()
  return useMutation<{ conversation: ChatConversation }, Error, string>({
    mutationFn: (id) =>
      adminFetch(`/admin/chat/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-chat-messages", id] })
      qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
    },
  })
}

export const useMarkRead = () => {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      adminFetch(`/admin/chat/${id}/read`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
    },
  })
}

// SSE hook for admin — receives all chat events
export function useChatSSE() {
  const qc = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const token = window.localStorage.getItem("medusa_admin_jwt")
    if (!token) return

    let active = true
    const controller = new AbortController()
    abortRef.current = controller

    const connect = async () => {
      try {
        const res = await fetch(`${backendUrl}/admin/chat/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!res.ok || !res.body) return

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (active) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const parts = buffer.split("\n\n")
          buffer = parts.pop() || ""

          for (const part of parts) {
            let eventName = "message"
            let data = ""
            for (const line of part.split("\n")) {
              if (line.startsWith("event: ")) eventName = line.slice(7).trim()
              if (line.startsWith("data: ")) data = line.slice(6).trim()
            }
            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              if (eventName === "new_message") {
                qc.setQueryData(
                  ["admin-chat-messages", parsed.conversation_id],
                  (old: any) => {
                    if (!old) return old
                    const exists = old.messages.some((m: ChatMessage) => m.id === parsed.id)
                    if (exists) return old
                    return { ...old, messages: [...old.messages, parsed] }
                  }
                )
                qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
              }
              if (eventName === "new_conversation") {
                qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
              }
            } catch { /* ignore */ }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return
        if (active) setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      active = false
      controller.abort()
    }
  }, [qc])
}
