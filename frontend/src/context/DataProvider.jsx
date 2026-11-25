import { useEffect, useMemo, useState } from "react"
import { DataContext } from "./dataContext"
import { tasks as demoTasks } from "@/data/tasks"
import { meetings as demoMeetings } from "@/data/meetings"
import { useMeetingEditing } from "@/hooks/useMeetingEditing"
import { useSheetData } from "@/hooks/useSheetData"
import { useTaskEditing } from "@/hooks/useTaskEditing"
import { API_CONFIGURED } from "@/lib/api"
import { applyLocal, emptyLocal, loadLocal, saveLocal, withField } from "@/lib/localTasks"
import { applyMeetingEdits, toMeetingObject } from "@/lib/meetingEdits"
import { resolveDefaultLink } from "@/lib/meetingLink"
import { todaysMeetings } from "@/lib/meetingState"
import { nextPriority } from "@/lib/priority"
import { loadSettings, saveSettings } from "@/lib/settings"
import { fetchSheetMeetings } from "@/lib/sheetMeetings"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { fetchSheetTasks } from "@/lib/sheetTasks"
import { applyEdits, stageEdits } from "@/lib/taskEdits"
import { getTaskStats } from "@/lib/taskStats"

const NO_LOCAL = emptyLocal()
const NO_MEETING_EDITS = { edits: {}, added: [] }

// Owns all task and meeting data, so every page shares one copy and the
// sheet is fetched once instead of every time you change page.
export default function DataProvider({ children }) {
  const tasksSheet = useSheetData(fetchSheetTasks)
  const meetingsSheet = useSheetData(fetchSheetMeetings)
  const [local, setLocal] = useState(loadLocal)
  const [demoMeetingsLocal, setDemoMeetingsLocal] = useState(NO_MEETING_EDITS)
  const [settings, setSettings] = useState(loadSettings)

  // Sync mode: a sheet AND the save server are configured, so edits are saved to the sheet
  const syncMode = SHEET_CONFIGURED && API_CONFIGURED
  const editing = useTaskEditing({ reload: tasksSheet.reload })
  const meetingEditing = useMeetingEditing({ reload: meetingsSheet.reload })

  const baseTasks = SHEET_CONFIGURED ? tasksSheet.items : demoTasks
  const baseMeetings = SHEET_CONFIGURED ? meetingsSheet.items : demoMeetings

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

  const meetings = useMemo(() => {
    if (syncMode) {
      return applyMeetingEdits(
        baseMeetings,
        meetingEditing.edits,
        meetingEditing.added,
        meetingsSheet.syncStartedAt
      )
    }
    if (!SHEET_CONFIGURED) {
      return applyMeetingEdits(
        baseMeetings,
        demoMeetingsLocal.edits,
        demoMeetingsLocal.added,
        0
      )
    }
    return baseMeetings
  }, [
    syncMode,
    baseMeetings,
    meetingEditing.edits,
    meetingEditing.added,
    meetingsSheet.syncStartedAt,
    demoMeetingsLocal,
  ])

  // The link a new meeting starts with: Settings first, otherwise the sheet's most-used link
  const defaultMeetingLink = useMemo(
    () => resolveDefaultLink(meetings, settings.defaultMeetingLink),
    [meetings, settings.defaultMeetingLink]
  )

  // Remember device-only changes and settings between visits
  useEffect(() => {
    saveLocal(local)
  }, [local])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

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

  // fields: any of { title, description, date, start, end, attendees, link, status, priority }
  const editMeeting = (id, fields) => {
    if (syncMode) {
      meetingEditing.edit(id, fields)
    } else if (!SHEET_CONFIGURED) {
      setDemoMeetingsLocal((prev) => ({
        ...prev,
        edits: stageEdits(prev.edits, id, fields),
      }))
    }
  }

  const addMeeting = (payload) => {
    if (syncMode) return meetingEditing.create(payload)
    if (!SHEET_CONFIGURED) {
      const id = `m-${Date.now()}`
      setDemoMeetingsLocal((prev) => ({
        ...prev,
        added: [toMeetingObject(id, payload, null), ...prev.added],
      }))
      return Promise.resolve(id)
    }
    return Promise.resolve(null)
  }

  const updateSettings = (patch) => setSettings((prev) => ({ ...prev, ...patch }))
  const resetLocal = () => {
    setLocal(emptyLocal())
    setDemoMeetingsLocal(NO_MEETING_EDITS)
  }

  const latestError =
    meetingEditing.error && (!editing.error || meetingEditing.error.at >= editing.error.at)
      ? meetingEditing.error
      : editing.error

  const value = {
    tasks,
    meetings,
    stats: getTaskStats(tasks),
    meetingsTodayCount: todaysMeetings(meetings).length,
    canEdit: !SHEET_CONFIGURED, // add and delete tasks: demo mode only
    canEditFields: syncMode, // title and due date: saved to the sheet
    canAddMeetings: syncMode || !SHEET_CONFIGURED,
    canEditMeetings: syncMode || !SHEET_CONFIGURED,
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
      saving: editing.saving + meetingEditing.saving,
      error: latestError,
      savedAt: Math.max(editing.savedAt, meetingEditing.savedAt),
      dismissError: () => {
        editing.dismissError()
        meetingEditing.dismissError()
      },
    },
    settings,
    updateSettings,
    defaultMeetingLink,
    resetLocal,
    toggleTask,
    cyclePriority,
    editTask,
    addTask,
    deleteTask,
    editMeeting,
    addMeeting,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}