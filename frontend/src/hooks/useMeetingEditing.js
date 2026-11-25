import { useCallback, useEffect, useRef, useState } from "react"
import { createMeeting, patchMeeting } from "@/lib/api"
import { createEditQueue } from "@/lib/editQueue"
import { toMeetingObject } from "@/lib/meetingEdits"
import { confirmEdits, revertEdits, stageEdits } from "@/lib/taskEdits"

// Optimistic editing and creation for meetings: changes show up immediately,
// save in the background, and are undone with an error message if a save fails.
export function useMeetingEditing({ reload }) {
  const [edits, setEdits] = useState({})
  const [added, setAdded] = useState([])
  const [saving, setSaving] = useState(0) // requests in flight
  const [error, setError] = useState(null) // { message, at }
  const [savedAt, setSavedAt] = useState(0)

  const reloadRef = useRef(reload)
  useEffect(() => {
    reloadRef.current = reload
  }, [reload])

  const [queue] = useState(() =>
    createEditQueue({
      send: patchMeeting,
      onSaving: (delta) => setSaving((n) => n + delta),
      onSaved: (id, patch, at) => {
        setEdits((prev) => confirmEdits(prev, id, patch, at))
        setSavedAt(at)
        reloadRef.current?.()
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

  const create = useCallback(async (payload) => {
    const tempId = `pending-${Date.now()}`
    const optimistic = toMeetingObject(tempId, payload, null)

    setAdded((prev) => [optimistic, ...prev])
    setError(null)
    setSaving((n) => n + 1)

    try {
      const { id } = await createMeeting(payload)
      const at = Date.now()
      setAdded((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id, confirmedAt: at } : m))
      )
      setSavedAt(at)
      reloadRef.current?.()
      return id
    } catch (err) {
      setAdded((prev) => prev.filter((m) => m.id !== tempId))
      setError({ message: err.message, at: Date.now() })
      return null
    } finally {
      setSaving((n) => n - 1)
    }
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  return { edits, added, edit, create, saving, error, savedAt, dismissError }
}