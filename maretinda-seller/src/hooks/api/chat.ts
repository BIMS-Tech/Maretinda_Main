import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { fetchQuery, backendUrl } from "../../lib/client/client"

export interface ChatConversation {
  id: string
  type: string
  seller_id: string | null
  customer_id: string | null
  subject: string | null
  status: string
  last_message_at: string | null
  unread_seller: number
  unread_customer: number
  unread_admin: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: "seller" | "customer" | "admin"
  sender_name: string
  body: string
  read_at: string | null
  created_at: string
}

export const useChatConversations = () => {
  return useQuery<{ conversations: ChatConversation[]; count: number; unread: number }>({
    queryKey: ["seller-chat-conversations"],
    queryFn: () => fetchQuery("/vendor/chat", { method: "GET" }),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  })
}

export const useChatMessages = (conversationId: string | null) => {
  return useQuery<{ conversation: ChatConversation; messages: ChatMessage[]; count: number }>({
    queryKey: ["seller-chat-messages", conversationId],
    queryFn: () => fetchQuery(`/vendor/chat/${conversationId}`, { method: "GET" }),
    enabled: !!conversationId,
    staleTime: 0,
  })
}

export const useSendMessage = (conversationId: string) => {
  const qc = useQueryClient()
  return useMutation<{ message: ChatMessage }, Error, { body: string }>({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/chat/${conversationId}/message`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-chat-messages", conversationId] })
      qc.invalidateQueries({ queryKey: ["seller-chat-conversations"] })
    },
  })
}

export const useMarkRead = () => {
  const qc = useQueryClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (conversationId) =>
      fetchQuery(`/vendor/chat/${conversationId}/read`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-chat-conversations"] })
    },
  })
}

// SSE hook — pushes live events into the query cache
export function useChatSSE() {
  const qc = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const token = window.localStorage.getItem("medusa_auth_token")
    if (!token) return

    let active = true
    const controller = new AbortController()
    abortRef.current = controller

    const connect = async () => {
      try {
        const res = await fetch(`${backendUrl}/vendor/chat/stream`, {
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
                  ["seller-chat-messages", parsed.conversation_id],
                  (old: any) => {
                    if (!old) return old
                    const exists = old.messages.some((m: ChatMessage) => m.id === parsed.id)
                    if (exists) return old
                    return { ...old, messages: [...old.messages, parsed] }
                  }
                )
                qc.invalidateQueries({ queryKey: ["seller-chat-conversations"] })
              }
              if (eventName === "new_conversation") {
                qc.invalidateQueries({ queryKey: ["seller-chat-conversations"] })
              }
            } catch { /* ignore malformed SSE */ }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return
        // Reconnect after 5 seconds on network error
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
