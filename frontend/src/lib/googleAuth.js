// Keeps the Google ID token the Go backend expects in "Authorization: Bearer".
// Google ID tokens last about an hour, so a stored token is checked before use
// and dropped once it expires, which puts the UI back into "signed out".

const STORAGE_KEY = "content-factory:google-token"

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim()

// True only when VITE_GOOGLE_CLIENT_ID is set in frontend/.env.local
export const SIGN_IN_CONFIGURED = Boolean(GOOGLE_CLIENT_ID)

// Reads the claims of a JWT without verifying it. The backend does the real
// verification; the frontend only needs "who" and "until when" for display.
export function tokenClaims(token) {
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const binary = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function isFresh(token) {
  const claims = tokenClaims(token)
  if (typeof claims?.exp !== "number") return false
  return claims.exp * 1000 > Date.now() + 30_000 // room for a request in flight
}

function stored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null // privacy modes can refuse storage; the tab still works signed in
  }
}

let current = (() => {
  const value = stored()
  return value && isFresh(value) ? value : null
})()

const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

// The signed-in token, or null when signed out or expired.
// Never notifies listeners: it is also used as a React snapshot, so it must be
// safe to call during render. The hook clears the UI on expiry with a timer.
export function getToken() {
  if (current && !isFresh(current)) {
    current = null
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // nothing to clean up
    }
  }
  return current
}

export function setToken(token) {
  if (!token || !isFresh(token)) return
  current = token
  try {
    sessionStorage.setItem(STORAGE_KEY, token)
  } catch {
    // still signed in for this tab
  }
  emit()
}

export function clearToken() {
  if (!current) return
  current = null
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clean up
  }
  emit()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// The Google account behind a token, for showing who is signed in.
export function emailFromToken(token) {
  const email = tokenClaims(token)?.email
  return typeof email === "string" ? email : ""
}
