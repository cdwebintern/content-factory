import { useState } from "react"
import { Ban, Check, Clock, Pencil, RotateCcw, Users } from "lucide-react"
import { dayLabel, formatTime } from "@/lib/dates"
import { formatFullDate } from "@/lib/dateFormat"
import { field, fieldLabel } from "@/lib/formStyles"
import { focusRing, tile } from "@/lib/glass"
import { isValidHHMM, nextMeetingPriority, toHHMM } from "@/lib/meetingEdits"
import { isWebLink } from "@/lib/meetingLink"
import { meetingPhase } from "@/lib/meetingState"
import { isValidYMD, toYMD } from "@/lib/taskEdits"
import { cn } from "@/lib/utils"
import JoinButton from "./JoinButton"
import PriorityBadge from "./PriorityBadge"

const PHASES = {
  live: { text: "Live now", className: "bg-red-100 text-red-700" },
  upcoming: { text: "Scheduled", className: "bg-sky-100 text-sky-800" },
  completed: { text: "Completed", className: "bg-emerald-100 text-emerald-800" },
  ended: { text: "Ended", className: "bg-black/5 text-neutral-600" },
  cancelled: { text: "Cancelled", className: "bg-red-100 text-red-700" },
}
const MUTED = ["completed", "ended", "cancelled"]

export default function MeetingCard({
  meeting,
  now = new Date(),
  detailed = false,
  isNext = false,
  onEdit,
}) {
  const phase = meetingPhase(meeting, now)
  const muted = MUTED.includes(phase)
  const status = PHASES[phase]
  const canJoin = !muted && Boolean(meeting.link)
  const isPendingCreate = String(meeting.id).startsWith("pending-")
  const editable = Boolean(onEdit) && !isPendingCreate

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [editError, setEditError] = useState("")

  const openEditor = () => {
    setEditError("")
    setDraft({
      title: meeting.title,
      description: meeting.description ?? "",
      date: toYMD(meeting.start),
      start: toHHMM(meeting.start),
      end: toHHMM(meeting.end),
      attendees: meeting.attendees ?? "",
      link: meeting.link ?? "",
    })
    setEditing(true)
  }

  const saveEdit = (e) => {
    e.preventDefault()
    const cleanTitle = draft.title.trim()
    const cleanLink = draft.link.trim()

    if (!cleanTitle) return setEditError("Title cannot be empty.")
    if (!isValidYMD(draft.date)) return setEditError("Choose a valid date.")
    if (!isValidHHMM(draft.start) || !isValidHHMM(draft.end)) {
      return setEditError("Enter valid start and end times.")
    }
    if (draft.end <= draft.start) return setEditError("End time must be after start time.")
    if (cleanLink && !isWebLink(cleanLink)) {
      return setEditError("Link must start with https:// or http://.")
    }

    const patch = {}
    if (cleanTitle !== meeting.title) patch.title = cleanTitle
    if (draft.description.trim() !== (meeting.description ?? "")) {
      patch.description = draft.description.trim()
    }
    if (draft.date !== toYMD(meeting.start)) patch.date = draft.date
    if (draft.start !== toHHMM(meeting.start) || draft.end !== toHHMM(meeting.end)) {
      patch.start = draft.start
      patch.end = draft.end
    }
    if (draft.attendees.trim() !== (meeting.attendees ?? "")) {
      patch.attendees = draft.attendees.trim()
    }
    if (cleanLink !== (meeting.link ?? "")) patch.link = cleanLink

    if (Object.keys(patch).length > 0) onEdit(patch)
    setEditing(false)
  }

  if (editing && draft) {
    return (
      <li
        id={`meeting-${meeting.id}`}
        className={cn(tile, "flex min-w-0 flex-col gap-3 border-2 border-neutral-900/25 p-3.5")}
      >
        <form onSubmit={saveEdit} className="space-y-2.5">
          <div>
            <label className={fieldLabel}>Title</label>
            <input
              autoFocus
              maxLength={120}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={field}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className={fieldLabel}>Date</label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={fieldLabel}>Start</label>
              <input
                type="time"
                value={draft.start}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={fieldLabel}>End</label>
              <input
                type="time"
                value={draft.end}
                onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                className={field}
              />
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Attendees</label>
            <input
              maxLength={200}
              value={draft.attendees}
              onChange={(e) => setDraft({ ...draft, attendees: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className={fieldLabel}>Meeting link</label>
            <input
              type="url"
              maxLength={500}
              value={draft.link}
              onChange={(e) => setDraft({ ...draft, link: e.target.value })}
              placeholder="https://zoom.us/j/..."
              className={field}
            />
          </div>
          <div>
            <label className={fieldLabel}>Description</label>
            <input
              maxLength={500}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className={field}
            />
          </div>

          {editError && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {editError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={cn(
                "rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white",
                focusRing
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700",
                focusRing
              )}
            >
              Save
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li
      id={`meeting-${meeting.id}`}
      className={cn(
        tile,
        "flex min-w-0 flex-col gap-2.5 p-3.5",
        !isNext && "border-2 border-neutral-900/25",
        muted && "bg-white/40",
        isNext && "ring-2 ring-neutral-900"
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-sm font-semibold text-neutral-900">
          {formatTime(meeting.start)} – {formatTime(meeting.end)}
        </p>
        <span className="text-xs text-neutral-500">
          {detailed ? formatFullDate(meeting.start) : dayLabel(meeting.start)}
        </span>
        <span className="ml-auto">
          {editable ? (
            <button
              type="button"
              onClick={() => onEdit({ priority: nextMeetingPriority(meeting.priority) })}
              title="Click to change priority"
              className={cn("rounded-full transition-opacity hover:opacity-80", focusRing)}
            >
              <PriorityBadge priority={meeting.priority} />
            </button>
          ) : (
            <PriorityBadge priority={meeting.priority} />
          )}
        </span>
      </div>

      {isNext && (
        <span className="w-fit rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-lime-accent">
          NEXT UP
        </span>
      )}

      <div className="flex items-start gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 wrap-break-word text-sm font-medium leading-snug text-neutral-900",
            muted && "text-neutral-500",
            phase === "cancelled" && "line-through"
          )}
        >
          {meeting.title}
        </p>
        {detailed && editable && (
          <button
            type="button"
            onClick={openEditor}
            aria-label={`Edit "${meeting.title}"`}
            className={cn(
              "shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-800",
              focusRing
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {detailed && meeting.description && (
        <p className="wrap-break-word text-xs leading-snug text-neutral-600">{meeting.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 shrink-0" />
          {meeting.attendees || "No attendees listed"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" />
          {meeting.durationMin} min
        </span>
      </div>

      {(detailed || canJoin) && (
        <div
          className={cn(
            "mt-auto flex flex-wrap items-center gap-2 border-t border-black/5 pt-2.5",
            detailed ? "justify-between" : "justify-end"
          )}
        >
          {detailed && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
                {status.text}
              </span>

              {editable && meeting.status === "scheduled" && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit({ status: "completed" })}
                    title="Mark completed"
                    aria-label={`Mark "${meeting.title}" as completed`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-emerald-50 hover:text-emerald-800",
                      focusRing
                    )}
                  >
                    <Check className="h-3 w-3" />
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit({ status: "cancelled" })}
                    title="Cancel meeting"
                    aria-label={`Cancel "${meeting.title}"`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-red-50 hover:text-red-700",
                      focusRing
                    )}
                  >
                    <Ban className="h-3 w-3" />
                    Cancel
                  </button>
                </>
              )}

              {editable && meeting.status !== "scheduled" && (
                <button
                  type="button"
                  onClick={() => onEdit({ status: "scheduled" })}
                  title="Reopen as scheduled"
                  aria-label={`Reopen "${meeting.title}"`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-sky-50 hover:text-sky-800",
                    focusRing
                  )}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reopen
                </button>
              )}
            </div>
          )}

          {canJoin && <JoinButton href={meeting.link} />}
        </div>
      )}
    </li>
  )
}