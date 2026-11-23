import { fetchRange } from "@/lib/sheetsApi"
import { PRIORITIES } from "@/lib/priority"
import { team } from "@/data/team"

const TAB = import.meta.env.VITE_SHEET_TAB || "Tasks"
const CELLS = "A1:Z1000"

// Header matching ignores case, spaces and underscores: "Task Title", "task_title"
// and "tasktitle" are all the same column.
const normalize = (h) => String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

const COLUMNS = {
  id: { label: "id", aliases: ["id", "taskid"], required: true },
  title: { label: "title", aliases: ["title", "tasktitle", "taskname", "task", "name"], required: true },
  due: { label: "due", aliases: ["due", "duedate", "deadline"], required: true },
  service: { aliases: ["service", "servicearea", "category", "type"] },
  priority: { aliases: ["priority"] },
  done: { aliases: ["done", "completed", "iscompleted"] },
  status: { aliases: ["status", "taskstatus"] },
  assignee: { aliases: ["assignee", "assignedto", "assigned", "owner"] },
}

const TRUE_VALUES = ["true", "yes", "y", "1", "done", "x", "completed", "complete"]
const DONE_STATUSES = ["completed", "complete", "done", "closed"]

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

  const header = values[0].map(normalize)
  const col = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, c]) => [key, header.findIndex((h) => c.aliases.includes(h))])
  )

  const missing = Object.entries(COLUMNS)
    .filter(([key, c]) => c.required && col[key] < 0)
    .map(([, c]) => c.label)
  if (missing.length > 0) {
    const found = values[0].map((h) => String(h ?? "").trim()).filter(Boolean)
    throw new Error(
      `The "${TAB}" tab needs column(s): ${missing.join(", ")}. ` +
        `Found in row 1: ${found.length ? found.join(", ") : "nothing"}.`
    )
  }

  const tasks = []
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

    // No id and no title means an empty placeholder row. Checkbox columns are
    // often pre-filled down the whole sheet, so done/status don't count as content.
    if (!id && !title) {
      const hasContent = ["due", "service", "priority", "assignee"].some((k) => cell(k) !== "")
      if (hasContent) skipped.push({ row: sheetRow, reason: "missing id and title" })
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
      done:
        TRUE_VALUES.includes(cell("done").toLowerCase()) ||
        DONE_STATUSES.includes(cell("status").toLowerCase()),
      assignee: findMember(cell("assignee")),
    })
  })

  return { tasks, skipped }
}

export async function fetchSheetTasks(signal) {
  const values = await fetchRange(TAB, CELLS, signal)
  const { tasks, skipped } = rowsToTasks(values)
  return { items: tasks, skipped }
}