import { useCallback, useEffect, useState } from "react"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"

// Stable empty values so components don't re-render for no reason
const NO_ITEMS = []
const NO_SKIPPED = []

// Loaders should return { items, skipped }. Older versions returned
// { tasks, skipped } or { meetings, skipped }, so those are accepted too.
// Anything else becomes a visible error instead of a silent empty list.
function normalizeResult(result, name) {
  const items = result?.items ?? result?.tasks ?? result?.meetings
  if (!Array.isArray(items)) {
    throw new Error(
      `${name} returned an unexpected result (no list of rows). Check that src/lib/sheetTasks.js and src/lib/sheetMeetings.js are the latest versions.`
    )
  }
  return { items, skipped: Array.isArray(result.skipped) ? result.skipped : NO_SKIPPED }
}

// fetcher(signal) must return { items, skipped } and must be a stable function
export function useSheetData(fetcher, refreshMs = 60000) {
  const enabled = SHEET_CONFIGURED
  const [data, setData] = useState(null) // { items, skipped } after the first success
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)
  const [syncStartedAt, setSyncStartedAt] = useState(0) // when the latest successful read began
  const [reloadKey, setReloadKey] = useState(0) // bumping this re-runs the effect

  useEffect(() => {
    if (!enabled) return

    let controller = null

    const run = () => {
      // A newer request cancels any older one still in flight
      controller?.abort()
      const current = new AbortController()
      controller = current
      const startedAt = Date.now()
      const name = fetcher.name || "loader"

      // State is only set inside these callbacks, never directly in the effect body
      fetcher(current.signal)
        .then((result) => normalizeResult(result, name))
        .then((result) => {
          if (current.signal.aborted) return
          if (import.meta.env.DEV) {
            console.debug(
              `[sheets] ${name}: ${result.items.length} loaded, ${result.skipped.length} skipped`
            )
          }
          setData(result)
          setError(null)
          setLastSynced(new Date())
          setSyncStartedAt(startedAt)
          setLoading(false)
          setRefreshing(false)
        })
        .catch((err) => {
          if (current.signal.aborted || err.name === "AbortError") return
          setError(err.message)
          setLoading(false)
          setRefreshing(false)
        })
    }

    run()

    // Refresh on a timer, and when the user comes back to this tab
    const timer = setInterval(() => {
      if (!document.hidden) run()
    }, refreshMs)
    const onVisible = () => {
      if (!document.hidden) run()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
      controller?.abort()
    }
  }, [enabled, fetcher, refreshMs, reloadKey])

  const reload = useCallback(() => {
    if (!enabled) return
    setRefreshing(true)
    setReloadKey((k) => k + 1)
  }, [enabled])

  const status = !enabled ? "demo" : loading ? "loading" : data ? "ready" : "error"

  return {
    status, // "demo" | "loading" | "ready" | "error"
    items: data?.items ?? NO_ITEMS,
    skipped: data?.skipped ?? NO_SKIPPED,
    error,
    lastSynced,
    syncStartedAt,
    refreshing,
    reload,
  }
}