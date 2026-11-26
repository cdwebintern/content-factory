import { useEffect, useSyncExternalStore } from "react"
import { clearToken, emailFromToken, getToken, subscribe, tokenClaims } from "@/lib/googleAuth"

// Re-renders when the token changes, expires or is cleared after a 401.
export function useGoogleAuth() {
  const token = useSyncExternalStore(subscribe, getToken)

  // Drop the token from the screen the moment Google says it expired
  useEffect(() => {
    if (!token) return
    const exp = tokenClaims(token)?.exp
    if (typeof exp !== "number") return
    const remaining = exp * 1000 - Date.now()
    if (remaining <= 0) {
      clearToken()
      return
    }
    const id = setTimeout(clearToken, remaining)
    return () => clearTimeout(id)
  }, [token])

  return { token, email: emailFromToken(token), signedIn: Boolean(token) }
}
