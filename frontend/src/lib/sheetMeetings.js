import { fetchRange } from "@/lib/sheetsApi"

const TAB = import.meta.env.VITE_MEETINGS_TAB || "Meetings"
const CELLS = "A1:Z1000"

// Header matching ignores case, spaces and underscores,
// so "meeting _title", "Meeting Title" and "meeting_title" all work
const normalizeHeader = (h) => String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

const REQUIRED = [
  { key: "id", name: "meeting_id", match: "meetingid" },
  { key: "title", name: "meeting_title", match: "meetingtitle" },
  { key: "date", name: "date", match: "date" },
  { key: "start", name: "start_time", match: "starttime" },
  { key: "end", name: "end_time", match: "endtime" },
]
const OPTIONAL = [
  { key: "description", match: "description" },
  { key: "attendees", match: "attendees" },
  { key: "link", match: "meetinglink" },
  { key: "status", match: "status" },
  { key: "priority", match: "priority" },
]

// "2026-11-24" -> { y, mo, d } (rejects impossible dates like 2026-02-31)
function parseYMD(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!m) return null
  const [y, mo, d] = m.slice(1).map(Number)
  const check = new Date(y, mo - 1, d)
  const real = check.getFullYear() === y && check.getMonth() === mo - 1 && check.getDate() === d
  return real ? { y, mo, d } : null
}

// Accepts "10:00", "10:00:00", "9:30 AM", "2:15 pm"
function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?$/i.exec(text.trim())
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const ampm = m[3]?.toLowerCase().replace(/\./g, "")
  if (min > 59) return null
  if (ampm) {
    if (h < 1 || h > 12) return null
    if (ampm === "pm" && h !== 12) h += 12
    if (ampm === "am" && h === 12) h = 0
  } else if (h > 23) {
    return null
  }
  return { h, min }
}

// Only web links get a Join button (blocks javascript: and other odd links)
function cleanLink(text) {
  try {
    const url = new URL(text.trim())
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""
  } catch {
    return ""
  }
}

function parseStatus(text) {
  const s = text.toLowerCase()
  if (["completed", "complete", "done"].includes(s)) return "completed"
  if (["cancelled", "canceled"].includes(s)) return "cancelled"
  return "scheduled"
}

function parsePriority(text) {
  const p = text.toLowerCase()
  if (p === "urgent") return "high"
  return ["low", "medium", "high"].includes(p) ? p : "medium"
}

// Turns the sheet's rows into meetings. Bad rows are skipped and reported.
export function rowsToMeetings(values) {
  if (!values || values.length === 0) return { meetings: [], skipped: [] }

  const header = values[0].map(normalizeHeader)
  const missing = REQUIRED.filter((c) => !header.includes(c.match)).map((c) => c.name)
  if (missing.length > 0) {
    throw new Error(
      `The "${TAB}" tab is missing column(s): ${missing.join(", ")}. Check the headers in row 1.`
    )
  }

  const col = Object.fromEntries(
    [...REQUIRED, ...OPTIONAL].map((c) => [c.key, header.indexOf(c.match)])
  )
  const meetings = []
  const skipped = []
  const seen = new Set()

  values.slice(1).forEach((row, i) => {
    const sheetRow = i + 2 // row 1 is the header
    const cell = (key) => {
      const idx = col[key]
      return idx < 0 ? "" : String(row[idx] ?? "").trim()
    }

    const id = cell("id")
    const title = cell("title")

    // No id and no title: an empty placeholder row. Only report it if it
    // has real content in another column (status/priority don't count,
    // because those columns can be pre-filled).
    if (!id && !title) {
      const hasContent = ["description", "date", "start", "end", "attendees", "link"].some(
        (k) => cell(k) !== ""
      )
      if (hasContent) skipped.push({ row: sheetRow, reason: "missing meeting_id and title" })
      return
    }
    if (!id || !title) {
      skipped.push({ row: sheetRow, reason: !id ? "missing meeting_id" : "missing meeting_title" })
      return
    }
    if (seen.has(id)) {
      skipped.push({ row: sheetRow, reason: `duplicate meeting_id "${id}"` })
      return
    }

    const day = parseYMD(cell("date"))
    if (!day) {
      skipped.push({ row: sheetRow, reason: `date "${cell("date")}" is not yyyy-mm-dd` })
      return
    }
    const from = parseTime(cell("start"))
    if (!from) {
      skipped.push({ row: sheetRow, reason: `start_time "${cell("start")}" is not a valid time` })
      return
    }
    const to = parseTime(cell("end"))
    if (!to) {
      skipped.push({ row: sheetRow, reason: `end_time "${cell("end")}" is not a valid time` })
      return
    }

    const start = new Date(day.y, day.mo - 1, day.d, from.h, from.min)
    const end = new Date(day.y, day.mo - 1, day.d, to.h, to.min)
    if (end <= start) {
      skipped.push({ row: sheetRow, reason: "end_time must be after start_time" })
      return
    }

    seen.add(id)
    meetings.push({
      id,
      title,
      description: cell("description"),
      start,
      end,
      durationMin: Math.round((end - start) / 60000),
      attendees: cell("attendees"),
      link: cleanLink(cell("link")),
      status: parseStatus(cell("status")),
      priority: parsePriority(cell("priority")),
    })
  })

  return { meetings, skipped }
}

export async function fetchSheetMeetings(signal) {
  const values = await fetchRange(TAB, CELLS, signal)
  const { meetings, skipped } = rowsToMeetings(values)
  return { items: meetings, skipped }
}