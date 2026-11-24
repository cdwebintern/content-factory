import { useCallback, useEffect, useRef, useState } from "react"
import { patchTask } from "@/lib/api"
import { createEditQueue } from "@/lib/editQueue"
import { confirmEdits, revertEdits, stageEdits } from "@/lib/taskEdits"

// Optimistic editing: a change shows up immediately, is saved in the background,
// and is undone with an error message if the save fails.
export function useTaskEditing({ reload }) {
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(0) // requests in flight
  const [error, setError] = useState(null) // { message, at }
  const [savedAt, setSavedAt] = useState(0)

  // The queue is created once, but should always call the newest reload()
  const reloadRef = useRef(reload)
  useEffect(() => {
    reloadRef.current = reload
  }, [reload])

  const [queue] = useState(() =>
    createEditQueue({
      send: patchTask,
      onSaving: (delta) => setSaving((n) => n + delta),
      onSaved: (id, patch, at) => {
        setEdits((prev) => confirmEdits(prev, id, patch, at))
        setSavedAt(at)
        reloadRef.current?.() // re-read the sheet so the screen matches it
      },
      onFailed: (id, fields, err) => {
        setEdits((prev) => revertEdits(prev, id, fields))
        setError({ message: err.message, at: Date.now() })
      },
    })
  )

  useEffect(() => () => queue.dispose(), [queue])

  const edit = useCallback(
    (id, fields) => {
      setEdits((prev) => stageEdits(prev, id, fields))
      setError(null)
      queue.enqueue(id, fields)
    },
    [queue]
  )

  const dismissError = useCallback(() => setError(null), [])

  return { edits, edit, saving, error, savedAt, dismissError }
}