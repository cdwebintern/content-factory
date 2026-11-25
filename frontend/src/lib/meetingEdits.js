import { toYMD } from "@/lib/taskEdits"

export const MEETING_PRIORITIES = ["low", "medium", "high"]
export const MEETING_STATUSES = ["scheduled", "completed", "cancelled"]

export const nextMeetingPriority = (priority) =>
  MEETING_PRIORITIES[(MEETING_PRIORITIES.indexOf(priority) + 1) % MEETING_PRIORITIES.length]

// Date -> "HH:MM" (24-hour clock expected by the Go backend)
export const toHHMM = (date) => {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export function isValidHHMM(text) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(text ?? "").trim())
  if (!m) return false
  const h = Number(m[1])
  const min = Number(m[2])
  return h >= 0 && h <= 23 && min >= 0 && min <= 59
}

// Combines "yyyy-mm-dd" and "HH:MM" into a local Date
export function combineDateAndTime(dateStr, timeStr) {
  const [y, mo, d] = dateStr.split("-").map(Number)
  const [h, min] = timeStr.split(":").map(Number)
  return new Date(y, mo - 1, d, h, min, 0, 0)
}

export function toMeetingObject(id, payload, confirmedAt = null) {
  const start = combineDateAndTime(payload.date, payload.start)
  const end = combineDateAndTime(payload.date, payload.end)
  return {
    id,
    title: payload.title,
    description: payload.description ?? "",
    start,
    end,
    durationMin: Math.round((end - start) / 60000),
    attendees: payload.attendees ?? "",
    link: payload.link ?? "",
    status: payload.status ?? "scheduled",
    priority: payload.priority ?? "medium",
    confirmedAt,
  }
}

// Puts optimistic edits and newly added meetings on top of the sheet's meetings.
// Once the sheet has been re-read after confirmation (syncStartedAt >= confirmedAt),
// the sheet row becomes the source of truth again.
export function applyMeetingEdits(baseMeetings, edits, added, syncStartedAt) {
  const baseIds = new Set(baseMeetings.map((m) => m.id))

  const pendingAdded = added.filter((item) => {
    if (baseIds.has(item.id)) return false
    if (item.confirmedAt !== null && syncStartedAt >= item.confirmedAt) return false
    return true
  })

  return [...baseMeetings, ...pendingAdded].map((meeting) => {
    const meetingEdits = edits[meeting.id]
    if (!meetingEdits) return meeting

    const activeValue = (field) => {
      const entry = meetingEdits[field]
      if (!entry) return undefined
      if (entry.confirmedAt !== null && syncStartedAt >= entry.confirmedAt) return undefined
      return entry.value
    }

    const next = { ...meeting }
    for (const field of ["title", "description", "attendees", "link", "status", "priority"]) {
      const v = activeValue(field)
      if (v !== undefined) next[field] = v
    }

    const dateVal = activeValue("date")
    const startVal = activeValue("start")
    const endVal = activeValue("end")
    if (dateVal !== undefined || startVal !== undefined || endVal !== undefined) {
      const dateStr = dateVal ?? toYMD(meeting.start)
      const startStr = startVal ?? toHHMM(meeting.start)
      const endStr = endVal ?? toHHMM(meeting.end)
      next.start = combineDateAndTime(dateStr, startStr)
      next.end = combineDateAndTime(dateStr, endStr)
      next.durationMin = Math.round((next.end - next.start) / 60000)
    }

    return next
  })
}