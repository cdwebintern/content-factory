import { useEffect, useMemo, useState } from "react"
import { DataContext } from "./dataContext"
import { tasks as demoTasks } from "@/data/tasks"
import { meetings as demoMeetings } from "@/data/meetings"
import { useSheetData } from "@/hooks/useSheetData"
import { useTaskEditing } from "@/hooks/useTaskEditing"
import { API_CONFIGURED } from "@/lib/api"
import { applyLocal, emptyLocal, loadLocal, saveLocal, withField } from "@/lib/localTasks"
import { todaysMeetings } from "@/lib/meetingState"
import { nextPriority } from "@/lib/priority"
import { fetchSheetMeetings } from "@/lib/sheetMeetings"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { fetchSheetTasks } from "@/lib/sheetTasks"
import { applyEdits } from "@/lib/taskEdits"
import { getTaskStats } from "@/lib/taskStats"

const NO_LOCAL = emptyLocal()

// Owns all task and meeting data, so every page shares one copy and the
// sheet is fetched once instead of every time you change page.
export default function DataProvider({ children }) {
  const tasksSheet = useSheetData(fetchSheetTasks)
  const meetingsSheet = useSheetData(fetchSheetMeetings)
  const [local, setLocal] = useState(loadLocal)

  // Sync mode: a sheet AND the save server are configured, so edits are saved to the sheet
  const syncMode = SHEET_CONFIGURED && API_CONFIGURED
  const editing = useTaskEditing({ reload: tasksSheet.reload })

  const baseTasks = SHEET_CONFIGURED ? tasksSheet.items : demoTasks
  const meetings = SHEET_CONFIGURED ? meetingsSheet.items : demoMeetings

  // Layers, bottom to top: sheet (or demo) data, unsaved/just-saved edits (sync mode),
  // then device-only changes (every other mode)
  const edited = useMemo(
    () => (syncMode ? applyEdits(baseTasks, editing.edits, tasksSheet.syncStartedAt) : baseTasks),
    [syncMode, baseTasks, editing.edits, tasksSheet.syncStartedAt]
  )
  const tasks = useMemo(
    () => applyLocal(edited, syncMode ? NO_LOCAL : local, !SHEET_CONFIGURED),
    [edited, syncMode, local]
  )

  // Remember device-only changes between visits
  useEffect(() => {
    saveLocal(local)
  }, [local])

  const changeField = (id, field, compute) =>
    setLocal((prev) => {
      const baseTask = [...baseTasks, ...prev.added].find((t) => t.id === id)
      return baseTask ? withField(prev, baseTask, field, compute) : prev
    })

  const toggleTask = (id) => {
    if (!syncMode) return changeField(id, "done", (done) => !done)
    const task = tasks.find((t) => t.id === id)
    if (task) editing.edit(id, { done: !task.done })
  }

  const cyclePriority = (id) => {
    if (!syncMode) return changeField(id, "priority", nextPriority)
    const task = tasks.find((t) => t.id === id)
    if (task) editing.edit(id, { priority: nextPriority(task.priority) })
  }

  // fields: any of { title, due: "yyyy-mm-dd", priority, done }
  const editTask = (id, fields) => {
    if (syncMode) editing.edit(id, fields)
  }

  const addTask = (task) => setLocal((prev) => ({ ...prev, added: [task, ...prev.added] }))

  const deleteTask = (id) =>
    setLocal((prev) => {
      const overrides = { ...prev.overrides }
      delete overrides[id]
      return prev.added.some((t) => t.id === id)
        ? { ...prev, overrides, added: prev.added.filter((t) => t.id !== id) }
        : { ...prev, overrides, deleted: [...prev.deleted, id] }
    })

  const value = {
    tasks,
    meetings,
    stats: getTaskStats(tasks),
    meetingsTodayCount: todaysMeetings(meetings).length,
    canEdit: !SHEET_CONFIGURED, // add and delete: demo mode only
    canEditFields: syncMode, // title and due date: saved to the sheet
    loading:
      SHEET_CONFIGURED &&
      (tasksSheet.status === "loading" || meetingsSheet.status === "loading"),
    tasksStatus: tasksSheet.status,
    meetingsStatus: meetingsSheet.status,
    sources: [
      { label: "Tasks", ...tasksSheet },
      { label: "Meetings", ...meetingsSheet },
    ],
    refreshing: tasksSheet.refreshing || meetingsSheet.refreshing,
    refreshAll: () => {
      tasksSheet.reload()
      meetingsSheet.reload()
    },
    saveStatus: {
      saving: editing.saving,
      error: editing.error,
      savedAt: editing.savedAt,
      dismissError: editing.dismissError,
    },
    toggleTask,
    cyclePriority,
    editTask,
    addTask,
    deleteTask,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}