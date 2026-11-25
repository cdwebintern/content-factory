import { useState } from "react"
import { Database, Link2, RefreshCw, RotateCcw } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import PageHeader from "@/components/layout/PageHeader"
import { useData } from "@/context/dataContext"
import { API_CONFIGURED } from "@/lib/api"
import { field, fieldLabel } from "@/lib/formStyles"
import { focusRing } from "@/lib/glass"
import { isWebLink } from "@/lib/meetingLink"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { cn } from "@/lib/utils"

const button =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-black/5 py-2.5 last:border-b-0">
      <dt className="text-sm text-neutral-600">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings, defaultMeetingLink, resetLocal, sources, refreshAll, refreshing } =
    useData()

  const [draft, setDraft] = useState(settings.defaultMeetingLink)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const usingOwnLink = isWebLink(settings.defaultMeetingLink)
  const lastSynced = sources
    .map((s) => s.lastSynced)
    .filter(Boolean)
    .reduce((a, b) => (a > b ? a : b), null)

  const saveLink = (e) => {
    e.preventDefault()
    const value = draft.trim()
    if (value && !isWebLink(value)) {
      setError("Enter a web address starting with https:// or http://")
      setSaved(false)
      return
    }
    setError("")
    updateSettings({ defaultMeetingLink: value })
    setDraft(value)
    setSaved(true)
  }

  const useSheetLink = () => {
    updateSettings({ defaultMeetingLink: "" })
    setDraft("")
    setError("")
    setSaved(true)
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Preferences for this device, and the status of your Google Sheets connection."
      />

      <GlassCard
        tone="sky"
        icon={Link2}
        title="Meetings"
        description="The link a new meeting starts with. You can still change it for each meeting."
      >
        <form onSubmit={saveLink} className="space-y-4">
          <div>
            <label htmlFor="default-link" className={fieldLabel}>
              Default meeting link
            </label>
            <input
              id="default-link"
              type="url"
              inputMode="url"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setSaved(false)
              }}
              placeholder="https://zoom.us/j/..."
              aria-invalid={Boolean(error)}
              aria-describedby="default-link-help"
              className={field}
            />
            {error && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {error}
              </p>
            )}
            <p id="default-link-help" className="mt-2 text-xs text-neutral-600">
              {defaultMeetingLink ? (
                <>
                  New meetings start with{" "}
                  <span className="break-all font-medium text-neutral-900">{defaultMeetingLink}</span>{" "}
                  ({usingOwnLink ? "your setting" : "the link most used in your sheet"}).
                </>
              ) : (
                "No meeting links found in your sheet yet. Set one here and new meetings will use it."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              className={cn(button, "bg-neutral-900 text-white hover:bg-neutral-700", focusRing)}
            >
              Save
            </button>
            {usingOwnLink && (
              <button
                type="button"
                onClick={useSheetLink}
                className={cn(
                  button,
                  "border border-white/80 bg-white/70 text-neutral-800 hover:bg-white",
                  focusRing
                )}
              >
                Use the sheet's link instead
              </button>
            )}
            {saved && (
              <span role="status" className="text-sm font-medium text-emerald-700">
                Saved
              </span>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard
        tone="lime"
        icon={Database}
        title="Google Sheets connection"
        description="Where your tasks and meetings come from."
      >
        <dl>
          <Row
            label="Reading from Google Sheets"
            value={SHEET_CONFIGURED ? "Connected" : "Not connected (demo data)"}
          />
          <Row
            label="Saving changes to the sheet"
            value={
              SHEET_CONFIGURED && API_CONFIGURED
                ? "On"
                : SHEET_CONFIGURED
                  ? "Off (set VITE_API_URL to turn it on)"
                  : "Off"
            }
          />
          <Row
            label="Last synced"
            value={lastSynced ? lastSynced.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not yet"}
          />
        </dl>

        {SHEET_CONFIGURED && (
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className={cn(
              button,
              "mt-4 w-fit border border-white/80 bg-white/80 text-neutral-900 hover:bg-white disabled:opacity-60",
              focusRing
            )}
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin motion-reduce:animate-none")}
            />
            {refreshing ? "Refreshing" : "Refresh now"}
          </button>
        )}
      </GlassCard>

      <GlassCard
        tone="peach"
        icon={RotateCcw}
        title="This device"
        description="Changes the dashboard only remembers on this device, such as ticks when saving is off and demo tasks."
      >
        <button
          type="button"
          onClick={() => {
            if (confirmReset) {
              resetLocal()
              setConfirmReset(false)
            } else {
              setConfirmReset(true)
            }
          }}
          onBlur={() => setConfirmReset(false)}
          className={cn(
            button,
            "w-fit",
            confirmReset
              ? "bg-red-500 text-white hover:bg-red-600"
              : "border border-white/80 bg-white/80 text-neutral-900 hover:bg-white",
            focusRing
          )}
        >
          {confirmReset ? "Click again to reset" : "Reset device-only changes"}
        </button>
        <p className="mt-2 text-xs text-neutral-600">
          This never changes your Google Sheet.
        </p>
      </GlassCard>
    </>
  )
}