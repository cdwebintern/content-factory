// Local changes layered on top of the base tasks (sheet or demo data):
//   overrides: tick / priority changes, remembered only while the base value is unchanged
//   added:     tasks created in the dashboard (demo mode only)
//   deleted:   ids hidden in the dashboard (demo mode only)

const KEY = "content-space:local:v2"
const FIELDS = ["done", "priority"]

export const emptyLocal = () => ({ overrides: {}, added: [], deleted: [] })

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyLocal()
    const p = JSON.parse(raw)

    const added = Array.isArray(p.added)
      ? p.added
          .filter((t) => t && typeof t.id === "string" && typeof t.title === "string")
          .map((t) => ({ ...t, due: new Date(t.due) })) // JSON turns Dates into text
          .filter((t) => !Number.isNaN(t.due.getTime()))
      : []

    return {
      overrides:
        p.overrides && typeof p.overrides === "object" && !Array.isArray(p.overrides)
          ? p.overrides
          : {},
      added,
      deleted: Array.isArray(p.deleted) ? p.deleted.filter((id) => typeof id === "string") : [],
    }
  } catch {
    return emptyLocal()
  }
}

export function saveLocal(local) {
  try {
    localStorage.setItem(KEY, JSON.stringify(local))
  } catch {
    // Storage is blocked or full: the app keeps working, it just won't remember
  }
}

// An override only applies while the base value is the same as when it was made,
// so a change in the sheet always wins over an old local change.
function mergeOverrides(task, overrides) {
  const o = overrides[task.id]
  if (!o) return task
  const next = { ...task }
  for (const field of FIELDS) {
    if (o[field] && o[field].from === task[field]) next[field] = o[field].value
  }
  return next
}

// includeStructural = true in demo mode: apply local adds and deletes.
// With a Google Sheet connected it is false, so leftover demo-mode adds and deletes
// can't hide or add tasks, and the sheet stays the single source of truth.
export function applyLocal(baseTasks, local, includeStructural = true) {
  const deleted = new Set(includeStructural ? local.deleted : [])
  const added = includeStructural ? local.added : []
  return [...baseTasks.filter((t) => !deleted.has(t.id)), ...added].map((t) =>
    mergeOverrides(t, local.overrides)
  )
}

// Returns a new `local` with one field changed. compute(current) gives the new value.
export function withField(local, baseTask, field, compute) {
  const current = mergeOverrides(baseTask, local.overrides)[field]
  const value = compute(current)

  const entry = { ...local.overrides[baseTask.id] }
  if (value === baseTask[field]) delete entry[field] // back to the base value
  else entry[field] = { value, from: baseTask[field] }

  const overrides = { ...local.overrides }
  if (Object.keys(entry).length === 0) delete overrides[baseTask.id]
  else overrides[baseTask.id] = entry

  return { ...local, overrides }
}