const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")

// True only when VITE_API_URL is set in frontend/.env.local
export const API_CONFIGURED = Boolean(API_URL)

// Sends changed fields to the Go backend, which writes them to the sheet.
// patch can hold: title, due ("yyyy-mm-dd"), priority, done
export async function patchTask(id, patch) {
  let res
  try {
    res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
  } catch (err) {
    throw new Error("Couldn't reach the save server. Is the backend running?", { cause: err })
  }

  if (!res.ok) {
    let message = `The save server returned an error (${res.status}).`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // The reply wasn't JSON, so keep the generic message
    }
    throw new Error(message)
  }

  return res.json()
}