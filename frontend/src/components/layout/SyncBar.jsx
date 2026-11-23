import { Info, RefreshCw } from "lucide-react"
import { useNow } from "@/hooks/useNow"
import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

function formatAgo(date, now) {
  const secs = Math.max(0, Math.round((now - date) / 1000))
  if (secs < 45) return "just now"
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)} h ago`
}

const actionBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-white disabled:opacity-60"

export default function SyncBar({ status, error, lastSynced, skipped, refreshing, onRefresh }) {
  const now = useNow(30000) // keeps "updated 2 min ago" fresh

  if (status === "loading") return null

  if (status === "demo") {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-2xl border border-neutral-300 bg-lime-accent/30 px-4 py-3 text-sm text-neutral-900 backdrop-blur-xl"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <b>Demo data.</b> To connect your Google Sheet, add <code>VITE_SHEET_ID</code> and{" "}
          <code>VITE_SHEETS_API_KEY</code> to <code>frontend/.env.local</code> and restart{" "}
          <code>npm run dev</code>.
        </p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
      >
        <p>
          <b>Couldn't load tasks from Google Sheets.</b> {error}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(actionBtn, focusRing)}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin motion-reduce:animate-none")} />
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 text-neutral-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          Synced from Google Sheets · updated {formatAgo(lastSynced, now)}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(actionBtn, focusRing)}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin motion-reduce:animate-none")} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error && (
        <p role="status" className="text-xs text-amber-700">
          Couldn't refresh ({error}). Showing the last synced data.
        </p>
      )}

            {skipped.length > 0 && (
        <details className="text-xs text-amber-800">
          <summary className="cursor-pointer font-medium">
            {skipped.length} {skipped.length === 1 ? "row was" : "rows were"} skipped
          </summary>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {skipped.slice(0, 10).map((s) => (
              <li key={`${s.row}-${s.reason}`}>
                Row {s.row}: {s.reason}
              </li>
            ))}
            {skipped.length > 10 && <li>…and {skipped.length - 10} more</li>}
          </ul>
        </details>
      )}
    </div>
  )
}