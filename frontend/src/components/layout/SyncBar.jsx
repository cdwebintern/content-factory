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

const latest = (dates) => dates.filter(Boolean).reduce((a, b) => (a > b ? a : b), null)

const actionBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-accent-mist hover:bg-white hover:text-accent-ink disabled:opacity-60"

// sources: [{ label, status, error, lastSynced, skipped }, ...]
export default function SyncBar({ sources, refreshing, onRefresh }) {
  const now = useNow(30000) // keeps "updated 2 min ago" fresh

  if (sources.some((s) => s.status === "loading")) return null

  const spin = cn("h-3.5 w-3.5", refreshing && "animate-spin motion-reduce:animate-none")

  if (sources.every((s) => s.status === "demo")) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-2xl border border-accent-tint bg-accent-soft/70 px-4 py-3 text-sm text-accent-dark backdrop-blur-xl"
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

  const failed = sources.filter((s) => s.status === "error")
  if (failed.length > 0) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
      >
        <div className="space-y-1">
          <p className="font-semibold">Couldn't load from Google Sheets.</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {failed.map((s) => (
              <li key={s.label}>
                <b>{s.label}:</b> {s.error}
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={onRefresh} disabled={refreshing} className={cn(actionBtn, focusRing)}>
          <RefreshCw className={spin} />
          Try again
        </button>
      </div>
    )
  }

  const lastSynced = latest(sources.map((s) => s.lastSynced))
  const refreshErrors = sources.filter((s) => s.error)
  const withSkipped = sources.filter((s) => s.skipped.length > 0)

  return (
    <div className="space-y-2 rounded-2xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm text-ink-soft backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                   Synced from Google Sheets · {sources.map((s) => `${s.items.length} ${s.label.toLowerCase()}`).join(" · ")}
          {lastSynced ? ` · updated ${formatAgo(lastSynced, now)}` : ""}
        </span>
        <button type="button" onClick={onRefresh} disabled={refreshing} className={cn(actionBtn, focusRing)}>
          <RefreshCw className={spin} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {refreshErrors.map((s) => (
        <p key={s.label} role="status" className="text-xs text-accent-deep">
          Couldn't refresh {s.label} ({s.error}). Showing the last synced data.
        </p>
      ))}

      {withSkipped.map((s) => (
        <details key={s.label} className="text-xs text-accent-burnt">
          <summary className="cursor-pointer font-medium">
            {s.label}: {s.skipped.length} {s.skipped.length === 1 ? "row was" : "rows were"} skipped
          </summary>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {s.skipped.slice(0, 10).map((x) => (
              <li key={`${x.row}-${x.reason}`}>
                Row {x.row}: {x.reason}
              </li>
            ))}
            {s.skipped.length > 10 && <li>…and {s.skipped.length - 10} more</li>}
          </ul>
        </details>
      ))}
    </div>
  )
}