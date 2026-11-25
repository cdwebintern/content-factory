import { Check, Info, RefreshCw, X } from "lucide-react"
import { useData } from "@/context/dataContext"
import { useNow } from "@/hooks/useNow"
import { cn } from "@/lib/utils"

export default function SaveStatus() {
  const { saveStatus } = useData()
  const { saving, error, savedAt, dismissError } = saveStatus
  const now = useNow(1000)

  const savedRecently = savedAt > 0 && now.getTime() - savedAt < 2500
  if (saving === 0 && !error && !savedRecently) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div
        role={error && saving === 0 ? "alert" : "status"}
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-xl",
          error && saving === 0
            ? "border-danger-border bg-danger-soft/95 text-danger"
            : "border-glass-line bg-glass/90 text-ink"
        )}
      >
        {saving > 0 ? (
          <>
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
            <span>Saving to Google Sheets…</span>
          </>
        ) : error ? (
          <>
            <Info className="h-4 w-4 shrink-0" />
            <span className="min-w-0 wrap-break-word">
              Couldn't save: {error.message} Your change was undone.
            </span>
            <button
              type="button"
              onClick={dismissError}
              aria-label="Dismiss"
              className="shrink-0 rounded-full p-1 hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Check className="h-4 w-4 shrink-0 text-accent-strong" />
            <span>Saved to Google Sheets</span>
          </>
        )}
      </div>
    </div>
  )
}