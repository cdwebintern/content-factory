import { useCallback, useEffect, useRef, useState } from "react"
import { SHEET_CONFIGURED, fetchSheetTasks } from "@/lib/sheetTasks"

// Stable empty values so components don't re-render for no reason
const NO_TASKS = []
const NO_SKIPPED = []

export function useSheetTasks(refreshMs = 60000) {
  const enabled = SHEET_CONFIGURED
  const [data, setData] = useState(null) // { tasks, skipped } after the first success
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)
  const controllerRef = useRef(null)

  const load = useCallback(
    async (manual = false) => {
      if (!enabled) return

      // A newer request cancels any older one still in flight
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      if (manual) setRefreshing(true)
      try {
        const result = await fetchSheetTasks(controller.signal)
        setData(result)
        setError(null)
        setLastSynced(new Date())
      } catch (err) {
        if (err.name === "AbortError") return
        setError(err.message)
      }
      setLoading(false)
      setRefreshing(false)
    },
    [enabled]
  )

  useEffect(() => {
    if (!enabled) return

    load()
    // Refresh on a timer, and when the user comes back to this tab
    const timer = setInterval(() => {
      if (!document.hidden) load()
    }, refreshMs)
    const onVisible = () => {
      if (!document.hidden) load()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      controllerRef.current?.abort()
    }
  }, [enabled, load, refreshMs])

  const status = !enabled ? "demo" : loading ? "loading" : data ? "ready" : "error"

  return {
    status, // "demo" | "loading" | "ready" | "error"
    tasks: data?.tasks ?? NO_TASKS,
    skipped: data?.skipped ?? NO_SKIPPED,
    error,
    lastSynced,
    refreshing,
    reload: () => load(true),
  }
}