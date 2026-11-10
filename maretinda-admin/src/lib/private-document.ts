import { backendUrl } from "./client"

/**
 * Seller applicants' documents are private: their links are admin API paths
 * (/admin/documents/<id>) that need the admin's token, so a plain link can't
 * open them. Older documents are still public URLs and open directly.
 */
export const isPrivateDocument = (url: string) => url.startsWith("/admin/documents/")

export async function openDocument(url: string) {
  if (!isPrivateDocument(url)) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }
  // Opened before the fetch so the browser doesn't treat it as a pop-up
  const tab = window.open("", "_blank")
  const token = localStorage.getItem("medusa_admin_jwt")
  const res = await fetch(`${backendUrl.replace(/\/$/, "")}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    tab?.close()
    throw new Error("Couldn't open the document")
  }
  const objectUrl = URL.createObjectURL(await res.blob())
  if (tab) tab.location.href = objectUrl
  else window.open(objectUrl, "_blank")
}
