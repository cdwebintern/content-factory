import { useEffect, useMemo, useState } from "react"
import { DataContext } from "./dataContext"
import { tasks as demoTasks } from "@/data/tasks"
import { meetings as demoMeetings } from "@/data/meetings"
import { currentUser, team as defaultTeam } from "@/data/team"
import { useMeetingEditing } from "@/hooks/useMeetingEditing"
import { useSheetData } from "@/hooks/useSheetData"
import { useTaskEditing } from "@/hooks/useTaskEditing"
import { API_CONFIGURED, createTask as createTaskOnServer } from "@/lib/api"
import { applyLocal, emptyLocal, loadLocal, saveLocal, withField } from "@/lib/localTasks"
import { applyMeetingEdits, toMeetingObject } from "@/lib/meetingEdits"
import { resolveDefaultLink } from "@/lib/meetingLink"
import { todaysMeetings } from "@/lib/meetingState"
import { nextPriority } from "@/lib/priority"
import { defaultTeamMap, loadSettings, saveSettings } from "@/lib/settings"
import { fetchSheetMeetings } from "@/lib/sheetMeetings"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { fetchSheetTasks } from "@/lib/sheetTasks"
import { applyEdits, stageEdits, toYMD } from "@/lib/taskEdits"
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

  // Team list with this device's renamed (and removed) members on top. Sheet
  // tasks still match assignees by the original names, so the sheet keeps working.
  const team = useMemo(
    () => [
      ...defaultTeam
        .filter((m) => m.id === currentUser.id || !settings.teamRemoved.includes(m.id))
        .map((m) => ({ ...m, ...settings.team[m.id] })),
      ...settings.teamAdded,
    ],
    [settings.team, settings.teamRemoved, settings.teamAdded]
  )

  // You are one of the team members, so your name and role come from `team`
  const profile = useMemo(() => {
    const me = team.find((m) => m.id === currentUser.id) ?? currentUser
    return { ...me, status: settings.profile.status }
  }, [team, settings.profile.status])

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
  const tasks = useMemo(() => {
    const list = applyLocal(edited, syncMode ? NO_LOCAL : local, !SHEET_CONFIGURED)
    // Tasks hold their own copy of the assignee, so hand them the current names
    return list.map((task) =>
      task.assignee
        ? { ...task, assignee: team.find((m) => m.id === task.assignee.id) ?? task.assignee }
        : task
    )
  }, [edited, syncMode, local, team])

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

  // In sync mode the sheet is the source of truth, so the server picks the id and
  // writes the row. Otherwise the task is kept on this device only.
  const addTask = async (task) => {
    if (!syncMode) {
      setLocal((prev) => ({ ...prev, added: [task, ...prev.added] }))
      return task.id
    }
    const { id } = await createTaskOnServer({
      title: task.title,
      service: task.service,
      due: toYMD(task.due),
      priority: task.priority,
      assignee: task.assignee?.name ?? "",
    })
    // Show the task straight away under the id the server assigned, then let the
    // sheet reload replace it with the saved row in the background.
    tasksSheet.prepend({ ...task, id })
    tasksSheet.reload()
    return id
  }

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

  // Added members are edited where they are stored, so there is only one copy
  const updateMember = (id, patch) =>
    setSettings((prev) =>
      prev.teamAdded.some((m) => m.id === id)
        ? {
            ...prev,
            teamAdded: prev.teamAdded.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          }
        : { ...prev, team: { ...prev.team, [id]: { ...prev.team[id], ...patch } } }
    )

  const addMember = ({ name, role }) =>
    setSettings((prev) => ({
      ...prev,
      teamAdded: [
        ...prev.teamAdded,
        { id: `member-${Date.now()}`, name, role },
      ],
    }))

  // Hides a member on this device. Their name stays in the saved `team` map, so
  // restoring them after a reset brings any rename back with them.
  // A member you added yourself is simply deleted.
  const removeMember = (id) => {
    if (id === currentUser.id) return
    setSettings((prev) => {
      if (prev.teamAdded.some((m) => m.id === id)) {
        return { ...prev, teamAdded: prev.teamAdded.filter((m) => m.id !== id) }
      }
      return prev.teamRemoved.includes(id)
        ? prev
        : { ...prev, teamRemoved: [...prev.teamRemoved, id] }
    })
  }

  // Puts the team back the way it started: original names and roles, every
  // removed member back, and the members added on this device gone
  const resetTeam = () =>
    setSettings((prev) => ({
      ...prev,
      team: { ...defaultTeamMap },
      teamRemoved: [],
      teamAdded: [],
    }))

  // Name and role are shared with the team list, so editing your profile there
  // and on the Settings page stay in step
  const updateProfile = (patch) => {
    const { status, ...details } = patch
    if (Object.keys(details).length) updateMember(currentUser.id, details)
    if (status !== undefined) {
      setSettings((prev) => ({ ...prev, profile: { ...prev.profile, status } }))
    }
  }
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
    canEdit: !SHEET_CONFIGURED, // delete tasks: demo mode only
    canAddTasks: syncMode || !SHEET_CONFIGURED, // new tasks are saved to the sheet in sync mode
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
    team,
    updateMember,
    addMember,
    removeMember,
    resetTeam,
    profile,
    updateProfile,
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