// Dates travel to the server as "yyyy-mm-dd" and live in the app as a Date at 5 PM local time.
export const toYMD = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const fromYMD = (text) => {
  const [y, m, d] = text.split("-").map(Number)
  return new Date(y, m - 1, d, 17, 0, 0, 0)
}

// true for a real date between 2000 and 2100 (the server enforces the same range)
export function isValidYMD(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const year = Number(text.slice(0, 4))
  if (year < 2000 || year > 2100) return false
  return toYMD(fromYMD(text)) === text // rejects things like 2026-02-31
}

// Edits are stored as { [taskId]: { [field]: { value, confirmedAt } } }.
// confirmedAt is null while saving, and a timestamp once the server has saved it.

export function stageEdits(prev, id, fields) {
  const entries = {}
  for (const [field, value] of Object.entries(fields)) {
    entries[field] = { value, confirmedAt: null }
  }
  return { ...prev, [id]: { ...prev[id], ...entries } }
}

export function confirmEdits(prev, id, saved, at) {
  const current = prev[id]
  if (!current) return prev

  const next = { ...current }
  for (const [field, value] of Object.entries(saved)) {
    // Only confirm if the screen still shows the value that was saved
    if (next[field]?.value === value) next[field] = { ...next[field], confirmedAt: at }
  }
  return { ...prev, [id]: next }
}

export function revertEdits(prev, id, fields) {
  const current = prev[id]
  if (!current) return prev

  const next = { ...current }
  for (const field of fields) delete next[field]
  return { ...prev, [id]: next }
}

// Puts the edits on top of the sheet's tasks. A saved edit stays on screen until the
// sheet has been re-read AFTER it was saved (syncStartedAt >= confirmedAt). From then on
// the sheet is the source of truth, so changes made by teammates are never hidden.
export function applyEdits(tasks, edits, syncStartedAt) {
  return tasks.map((task) => {
    const taskEdits = edits[task.id]
    if (!taskEdits) return task

    const next = { ...task }
    for (const [field, entry] of Object.entries(taskEdits)) {
      if (entry.confirmedAt !== null && syncStartedAt >= entry.confirmedAt) continue
      next[field] = field === "due" ? fromYMD(entry.value) : entry.value
    }
    return next
  })
}