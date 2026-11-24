// Collects edits per task, waits a moment so quick changes are combined into one
// request, and never has more than one request in flight for the same task.
// If the user edits again while a save is running, the newer edit goes out afterwards.
export function createEditQueue({ send, onSaving, onSaved, onFailed, debounceMs = 400 }) {
  const jobs = new Map() // task id -> { patch, timer, inFlight }

  async function flush(id) {
    const job = jobs.get(id)
    if (!job || job.inFlight || Object.keys(job.patch).length === 0) return

    const patch = job.patch
    job.patch = {}
    job.inFlight = true
    onSaving(1)

    try {
      await send(id, patch)
      onSaved(id, patch, Date.now())
    } catch (err) {
      // Fields edited again while this request ran keep their newer value
      const fields = Object.keys(patch).filter((f) => !(f in job.patch))
      onFailed(id, fields, err)
    } finally {
      job.inFlight = false
      onSaving(-1)
      if (Object.keys(job.patch).length > 0) flush(id) // edits made while saving
      else if (!job.timer) jobs.delete(id)
    }
  }

  function enqueue(id, fields) {
    const job = jobs.get(id) ?? { patch: {}, timer: null, inFlight: false }
    jobs.set(id, job)

    job.patch = { ...job.patch, ...fields }
    clearTimeout(job.timer)
    job.timer = setTimeout(() => {
      job.timer = null
      flush(id)
    }, debounceMs)
  }

  // Only clears timers, so the queue stays usable (React dev mode mounts twice)
  function dispose() {
    for (const job of jobs.values()) clearTimeout(job.timer)
  }

  return { enqueue, dispose }
}