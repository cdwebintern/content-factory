import { clearToken, getToken } from "./googleAuth"

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")

// True only when VITE_API_URL is set in frontend/.env.local
export const API_CONFIGURED = Boolean(API_URL)

async function request(path, method, payload) {
  // The production backend runs AUTH_MODE=google and reads the ID token here
  const token = getToken()
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    throw new Error("Couldn't reach the save server. Is the backend running?", { cause: err })
  }

  // A rejected or expired token is useless from here on, so sign the tab out
  if (res.status === 401) clearToken()

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

// Sends changed fields to the Go backend, which writes them to the sheet.
// patch can hold: title, due ("yyyy-mm-dd"), priority, done
export function patchTask(id, patch) {
  return request(`/api/tasks/${encodeURIComponent(id)}`, "PATCH", patch)
}

// Sends changed meeting fields to the Go backend, which writes them to the sheet.
// patch can hold: title, description, date ("yyyy-mm-dd"), start ("HH:MM"),
// end ("HH:MM"), attendees, link, status, priority
export function patchMeeting(id, patch) {
  return request(`/api/meetings/${encodeURIComponent(id)}`, "PATCH", patch)
}

// Appends a new meeting row to the Google Sheet via the Go backend.
// Requires: title, date ("yyyy-mm-dd"), start ("HH:MM"), end ("HH:MM")
export function createMeeting(meeting) {
  return request("/api/meetings", "POST", meeting)
}