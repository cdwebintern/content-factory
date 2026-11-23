import { PRIORITIES } from "@/lib/priority"
import { team } from "@/data/team"

const SHEET_ID = import.meta.env.VITE_SHEET_ID
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY
const TAB = import.meta.env.VITE_SHEET_TAB || "Tasks"
const RANGE = `${TAB}!A1:G1000`

// True only when both values exist in frontend/.env.local
export const SHEET_CONFIGURED = Boolean(SHEET_ID && API_KEY)

const REQUIRED = ["id", "title", "service", "due", "priority", "done", "assignee"]
const TRUE_VALUES = ["true", "yes", "y", "1", "done", "x"]

// "2026-11-30" -> Date at 5 PM local time (same as the Add task form)
function parseDue(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!m) return null
  const [y, mo, d] = m.slice(1).map(Number)
  const date = new Date(y, mo - 1, d, 17, 0, 0, 0)
  // Reject impossible dates like 2026-02-31 (JS would roll them into March)
  const real =
    date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
  return real ? date : null
}

const findMember = (value) => {
  const key = value.trim().toLowerCase()
  return team.find((m) => m.id === key || m.name.toLowerCase() === key)
}

// Turns the sheet's rows into tasks. Bad rows are skipped and reported.
export function rowsToTasks(values) {
  if (!values || values.length === 0) return { tasks: [], skipped: [] }

  const header = values[0].map((h) => String(h).trim().toLowerCase())
  const missing = REQUIRED.filter((c) => !header.includes(c))
  if (missing.length > 0) {
    throw new Error(
      `The sheet is missing column(s): ${missing.join(", ")}. Check the headers in row 1.`
    )
  }
  const col = Object.fromEntries(REQUIRED.map((c) => [c, header.indexOf(c)]))

  const tasks = []
  const skipped = []
  const seen = new Set()

  values.slice(1).forEach((row, i) => {
    const sheetRow = i + 2 // row 1 is the header
    const cell = (name) => String(row[col[name]] ?? "").trim()

    const id = cell("id")
    const title = cell("title")

    // No id and no title means an empty placeholder row. The "done" checkboxes are
    // pre-filled with FALSE down the whole column, so that column doesn't count as
    // content. Only report the row if some OTHER column has something in it.
    if (!id && !title) {
      const hasOtherContent = REQUIRED.some(
        (name) => !["id", "title", "done"].includes(name) && cell(name) !== ""
      )
      if (hasOtherContent) skipped.push({ row: sheetRow, reason: "missing id and title" })
      return
    }

    if (!id || !title) {
      skipped.push({ row: sheetRow, reason: !id ? "missing id" : "missing title" })
      return
    }
    if (seen.has(id)) {
      skipped.push({ row: sheetRow, reason: `duplicate id "${id}"` })
      return
    }
    const due = parseDue(cell("due"))
    if (!due) {
      skipped.push({ row: sheetRow, reason: `due date "${cell("due")}" is not yyyy-mm-dd` })
      return
    }

    seen.add(id)
    const priority = cell("priority").toLowerCase()
    tasks.push({
      id,
      title,
      service: cell("service") || "Other",
      due,
      priority: PRIORITIES.includes(priority) ? priority : "medium",
      done: TRUE_VALUES.includes(cell("done").toLowerCase()),
      assignee: findMember(cell("assignee")),
    })
  })

  return { tasks, skipped }
}

async function describeError(res) {
  let detail = ""
  try {
    detail = (await res.json())?.error?.message ?? ""
  } catch {
    // The error body wasn't JSON, so just use the status code
  }

  if (res.status === 400) {
    return `Google rejected the request (${detail || "bad request"}). Check VITE_SHEETS_API_KEY and that the tab is named "${TAB}".`
  }
  if (res.status === 403) {
    return 'Google refused the request. Check that the Sheets API is enabled, the API key allows this website, and the sheet is shared as "Anyone with the link: Viewer".'
  }
  if (res.status === 404) {
    return "Google could not find the spreadsheet. Check VITE_SHEET_ID."
  }
  if (res.status === 429) {
    return "Too many requests to Google. Wait a minute, then refresh."
  }
  return `Google returned an error (${res.status}). ${detail}`
}

export async function fetchSheetTasks(signal) {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
    `/values/${encodeURIComponent(RANGE)}?key=${encodeURIComponent(API_KEY)}`

  let res
  try {
    res = await fetch(url, { signal, cache: "no-store" })
  } catch (err) {
    if (err.name === "AbortError") throw err
    throw new Error("Could not reach Google. Check your internet connection.")
  }

  if (!res.ok) throw new Error(await describeError(res))

  const data = await res.json()
  return rowsToTasks(data.values)
}