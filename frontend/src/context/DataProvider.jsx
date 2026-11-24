import { useEffect, useMemo, useState } from "react"
import { DataContext } from "./dataContext"
import { tasks as demoTasks } from "@/data/tasks"
import { meetings as demoMeetings } from "@/data/meetings"
import { useSheetData } from "@/hooks/useSheetData"
import { applyLocal, loadLocal, saveLocal, withField } from "@/lib/localTasks"
import { todaysMeetings } from "@/lib/meetingState"
import { nextPriority } from "@/lib/priority"
import { fetchSheetMeetings } from "@/lib/sheetMeetings"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { fetchSheetTasks } from "@/lib/sheetTasks"
import { getTaskStats } from "@/lib/taskStats"

// Owns all task and meeting data, so every page shares one copy and the
// sheet is fetched once instead of every time you change page.
export default function DataProvider({ children }) {
  const tasksSheet = useSheetData(fetchSheetTasks)
  const meetingsSheet = useSheetData(fetchSheetMeetings)
  const [local, setLocal] = useState(loadLocal)

  // Base data comes from the sheet, or from the demo data when no sheet is connected.
  // Local task changes (ticks, priorities, and in demo mode adds/deletes) go on top.
  const baseTasks = SHEET_CONFIGURED ? tasksSheet.items : demoTasks
  const meetings = SHEET_CONFIGURED ? meetingsSheet.items : demoMeetings
  const tasks = useMemo(
    () => applyLocal(baseTasks, local, !SHEET_CONFIGURED),
    [baseTasks, local]
  )

  // Remember local changes between visits
  useEffect(() => {
    saveLocal(local)
  }, [local])

  const changeField = (id, field, compute) =>
    setLocal((prev) => {
      const baseTask = [...baseTasks, ...prev.added].find((t) => t.id === id)
      return baseTask ? withField(prev, baseTask, field, compute) : prev
    })

  const toggleTask = (id) => changeField(id, "done", (done) => !done)
  const cyclePriority = (id) => changeField(id, "priority", nextPriority)

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
    canEdit: !SHEET_CONFIGURED, // with a sheet connected, tasks are edited in Google Sheets
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
    toggleTask,
    cyclePriority,
    addTask,
    deleteTask,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}