import Medusa from "@medusajs/js-sdk"

export const backendUrl = __BACKEND_URL__ ?? "/"
export const publishableApiKey = __PUBLISHABLE_API_KEY__ ?? ""

const token = window.localStorage.getItem("medusa_auth_token") || ""

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey: publishableApiKey,
})

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  ;(window as any).__sdk = sdk
}

export const importProductsQuery = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  return await fetch(`${backendUrl}/vendor/products/import`, {
    method: "POST",
    body: formData,
    headers: {
      authorization: `Bearer ${token}`,
      "x-publishable-api-key": publishableApiKey,
    },
  })
    .then((res) => res.json())
    .catch(() => null)
}

export const uploadFilesQuery = async (files: any[]) => {
  const formData = new FormData()

  for (const { file } of files) {
    formData.append("files", file)
  }

  // Upload directly to Google Cloud Storage via /uploads-vendor
  try {
    console.log('[Upload] 📤 Uploading', files.length, 'files to Google Cloud Storage...')
    const uploadStart = Date.now()

    const response = await fetch(`${backendUrl}/uploads-vendor`, {
      method: "POST",
      body: formData,
      headers: {
        authorization: `Bearer ${token}`,
        "x-publishable-api-key": publishableApiKey,
      },
    })
    
    const uploadTime = Date.now() - uploadStart
    console.log('[Upload] Response received in', uploadTime, 'ms')
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Upload] ❌ Error:', errorText)
      throw new Error(`Upload failed: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[Upload] ✅ Success!', data.files?.length, 'files uploaded to GCS')
    console.log('[Upload] Files stored at: Google Cloud Storage')
    
    return data
  } catch (error) {
    console.error('[Upload] ❌ Exception:', error)
    throw error // Re-throw so UI can show error
  }
}

/**
 * Uploads a reel video (and optional poster frame) to GCS. Separate from
 * uploadFilesQuery because reels hit /uploads-vendor/video, which allows a
 * 150MB body and skips the WebP conversion for the video itself.
 */
export const uploadReelVideoQuery = async (
  video: File,
  poster?: File | null
): Promise<{
  video: { url: string; name: string; size: number } | null
  poster: { url: string } | null
  errors?: { filename: string; error: string }[]
}> => {
  const formData = new FormData()
  formData.append("files", video)
  if (poster) formData.append("files", poster)

  const bearer = window.localStorage.getItem("medusa_auth_token") || ""

  const response = await fetch(`${backendUrl}/uploads-vendor/video`, {
    method: "POST",
    body: formData,
    headers: {
      authorization: `Bearer ${bearer}`,
      "x-publishable-api-key": publishableApiKey,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || `Upload failed: ${response.status}`)
  }

  return response.json()
}

export const fetchQuery = async (
  url: string,
  {
    method,
    body,
    query,
    headers,
  }: {
    method: "GET" | "POST" | "DELETE"
    body?: object
    query?: Record<string, string | number>
    headers?: { [key: string]: string }
  }
) => {
  const bearer = window.localStorage.getItem("medusa_auth_token") || ""
  const params = Object.entries(query || {}).reduce(
    (acc, [key, value], index) => {
      if (value && value !== undefined) {
        const queryLength = Object.values(query || {}).filter(
          (i) => i && i !== undefined
        ).length
        acc += `${key}=${value}${index + 1 <= queryLength ? "&" : ""}`
      }
      return acc
    },
    ""
  )
  const response = await fetch(`${backendUrl}${url}${params && `?${params}`}`, {
    method: method,
    headers: {
      authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableApiKey,
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }))

    // Only redirect to login for authentication failures on the auth/session endpoint
    // Other 401s (e.g., permission denied on a specific resource) should not log the user out
    if (response.status === 401 && (url.includes("/auth") || url.includes("/session"))) {
      console.warn("Session expired, redirecting to login")
      window.localStorage.removeItem("medusa_auth_token")
      window.location.href = "/login"
      throw new Error("Authentication failed. Please log in again.")
    }

    throw new Error(errorData.message || "Nieznany błąd serwera")
  }

  return response.json()
}
