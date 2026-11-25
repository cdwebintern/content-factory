import { useState } from "react"
import { X } from "lucide-react"
import { field, fieldLabel } from "@/lib/formStyles"
import { focusRing } from "@/lib/glass"
import { isValidHHMM, MEETING_PRIORITIES } from "@/lib/meetingEdits"
import { isWebLink } from "@/lib/meetingLink"
import { isValidYMD, toYMD } from "@/lib/taskEdits"
import { cn } from "@/lib/utils"

export default function AddMeetingForm({ defaultLink = "", onAdd, onCancel }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(() => toYMD(new Date()))
  const [start, setStart] = useState("10:00")
  const [end, setEnd] = useState("10:30")
  const [attendees, setAttendees] = useState("")
  const [link, setLink] = useState(defaultLink)
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanTitle = title.trim()
    const cleanLink = link.trim()

    if (!cleanTitle) {
      setError("Please enter a meeting title.")
      return
    }
    if (!isValidYMD(date)) {
      setError("Please choose a valid date.")
      return
    }
    if (!isValidHHMM(start) || !isValidHHMM(end)) {
      setError("Please choose valid start and end times.")
      return
    }
    if (end <= start) {
      setError("End time must be after start time.")
      return
    }
    if (cleanLink && !isWebLink(cleanLink)) {
      setError("Meeting link must start with https:// or http://.")
      return
    }

    onAdd({
      title: cleanTitle,
      description: description.trim(),
      date,
      start,
      end,
      attendees: attendees.trim(),
      link: cleanLink,
      status: "scheduled",
      priority,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="space-y-3 rounded-2xl border border-glass-line bg-glass/70 p-4 shadow-sm shadow-shade/5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">New meeting</h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className={cn("rounded-full p-2 text-ink-faint transition-colors hover:bg-accent-soft hover:text-accent-burnt", focusRing)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label htmlFor="new-meeting-title" className={fieldLabel}>
          Title
        </label>
        <input
          id="new-meeting-title"
          autoFocus
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError("")
          }}
          placeholder="e.g. Weekly growth sync"
          className={field}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor="new-meeting-date" className={fieldLabel}>
            Date
          </label>
          <input
            id="new-meeting-date"
            type="date"
            required
            min="2000-01-01"
            max="2100-12-31"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              if (error) setError("")
            }}
            className={field}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="new-meeting-start" className={fieldLabel}>
            Start time
          </label>
          <input
            id="new-meeting-start"
            type="time"
            required
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              if (error) setError("")
            }}
            className={field}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="new-meeting-end" className={fieldLabel}>
            End time
          </label>
          <input
            id="new-meeting-end"
            type="time"
            required
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              if (error) setError("")
            }}
            className={field}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="new-meeting-attendees" className={fieldLabel}>
            Attendees
          </label>
          <input
            id="new-meeting-attendees"
            maxLength={200}
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="e.g. Client Team, Bilal"
            className={field}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="new-meeting-link" className={fieldLabel}>
            Meeting link
          </label>
          <input
            id="new-meeting-link"
            type="url"
            inputMode="url"
            maxLength={500}
            value={link}
            onChange={(e) => {
              setLink(e.target.value)
              if (error) setError("")
            }}
            placeholder="https://zoom.us/j/..."
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="new-meeting-desc" className={fieldLabel}>
          Description (optional)
        </label>
        <input
          id="new-meeting-desc"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Agenda or notes"
          className={field}
        />
      </div>

      <div>
        <span className={fieldLabel}>Priority</span>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-accent-ink/5 p-1 sm:rounded-full">
          {MEETING_PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={priority === p}
              onClick={() => setPriority(p)}
              className={cn(
                "rounded-full px-2 py-2 text-xs font-medium capitalize transition-all duration-200",
                focusRing,
                priority === p
                  ? "bg-accent-strong text-white shadow-sm shadow-shade/20"
                  : "text-ink-muted hover:bg-accent-soft/70 hover:text-accent-ink"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "rounded-full border border-glass-line bg-glass/70 px-4 py-2.5 text-sm font-medium text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass hover:text-accent-ink",
            focusRing
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={cn(
            "hover-lift rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-shade/20 hover:bg-accent",
            focusRing
          )}
        >
          Add meeting
        </button>
      </div>
    </form>
  )
}