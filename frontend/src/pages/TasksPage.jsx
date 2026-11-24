import { useEffect, useMemo, useState } from "react"
import { CheckSquare, Plus } from "lucide-react"
import FilterTabs from "@/components/layout/FilterTabs"
import GlassCard from "@/components/layout/GlassCard"
import PageHeader from "@/components/layout/PageHeader"
import SearchField from "@/components/layout/SearchField"
import StatTile from "@/components/layout/StatTile"
import AddTaskForm from "@/components/tasks/AddTaskForm"
import TaskCard from "@/components/tasks/TaskCard"
import { useData } from "@/context/dataContext"
import { team } from "@/data/team"
import { field } from "@/lib/formStyles"
import { focusRing } from "@/lib/glass"
import { scrollToId } from "@/lib/scroll"
import { PRIORITY_RANK, taskFilters } from "@/lib/taskStats"
import { cn } from "@/lib/utils"

const SORTERS = {
  due: (a, b) => Number(a.done) - Number(b.done) || a.due - b.due,
  priority: (a, b) =>
    Number(a.done) - Number(b.done) ||
    PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
    a.due - b.due,
  title: (a, b) => a.title.localeCompare(b.title),
}

const EMPTY = {
  pending: "Nothing pending. You're all caught up 🎉",
  high: "No high-priority tasks right now.",
  today: "Nothing due today.",
  overdue: "No overdue tasks. Nice work 🎉",
  done: "No completed tasks yet.",
  all: "No tasks yet.",
}

export default function TasksPage() {
  const { tasks, stats, canEdit, tasksStatus, toggleTask, cyclePriority, addTask, deleteTask } =
    useData()
    const { canEditFields, editTask } = useData()

  const [filter, setFilter] = useState("pending")
  const [query, setQuery] = useState("")
  const [service, setService] = useState("all")
  const [assignee, setAssignee] = useState("all")
  const [sort, setSort] = useState("due")
  const [adding, setAdding] = useState(false)
  const [lastAddedId, setLastAddedId] = useState(null)

  const services = useMemo(() => [...new Set(tasks.map((t) => t.service))].sort(), [tasks])
  const hasUnassigned = tasks.some((t) => !t.assignee)

  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "high", label: "High priority" },
    { id: "today", label: "Due today" },
    { id: "overdue", label: "Overdue", alert: true },
    { id: "done", label: "Done" },
    { id: "all", label: "All" },
  ].map((t) => ({ ...t, count: tasks.filter(taskFilters[t.id]).length }))

  const q = query.trim().toLowerCase()
  const visible = tasks
    .filter(taskFilters[filter])
    .filter((t) => service === "all" || t.service === service)
    .filter((t) =>
      assignee === "all" ? true : assignee === "none" ? !t.assignee : t.assignee?.id === assignee
    )
    .filter(
      (t) =>
        !q ||
        [t.title, t.id, t.service, t.assignee?.name ?? ""].some((s) => s.toLowerCase().includes(q))
    )
    .sort(SORTERS[sort])

  const hasFilters = q !== "" || service !== "all" || assignee !== "all"
  const clearFilters = () => {
    setQuery("")
    setService("all")
    setAssignee("all")
  }

  const handleAdd = (task) => {
    addTask(task)
    setAdding(false)
    setFilter("pending") // make sure the new task is visible
    clearFilters()
    setLastAddedId(task.id)
  }

  // After adding: scroll the new task into view, then drop the highlight
  useEffect(() => {
    if (!lastAddedId) return
    scrollToId(`task-${lastAddedId}`, "center")
    const id = setTimeout(() => setLastAddedId(null), 2500)
    return () => clearTimeout(id)
  }, [lastAddedId])

  const addButton =
    canEdit && !adding ? (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700",
          focusRing
        )}
      >
        <Plus className="h-4 w-4" />
        Add task
      </button>
    ) : null

  return (
    <>
      <PageHeader
        title="Tasks"
        description={
          canEdit
            ? "Every task, with its service, due date, priority and owner."
            : canEditFields
  ? "Every task from your Google Sheet. Changes you make here (title, due date, priority, done) are saved back to the sheet."
  : "Every task from your Google Sheet. Edit tasks in the sheet; ticks and priority changes made here stay on this device."
        }
        action={addButton}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Total tasks" value={stats.total} />
        <StatTile label="Pending" value={stats.pending} />
        <StatTile label="Due today" value={stats.today} accent={stats.today > 0 ? "lime" : "neutral"} />
        <StatTile label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? "red" : "neutral"} />
        <StatTile label="High priority" value={stats.high} />
        <StatTile label="Done" value={stats.done} />
      </div>

      <GlassCard
        tone="lime"
        icon={CheckSquare}
        title="All tasks"
        description={`Showing ${visible.length} of ${tasks.length}`}
      >
        <div className="space-y-4">
          {adding && <AddTaskForm onAdd={handleAdd} onCancel={() => setAdding(false)} />}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))]">
            <SearchField
              className="sm:col-span-2 xl:col-span-1"
              value={query}
              onChange={setQuery}
              placeholder="Search by title, id or person"
              label="Search tasks"
            />
            <select
              aria-label="Filter by service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className={field}
            >
              <option value="all">All services</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={field}
            >
              <option value="all">Everyone</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              {hasUnassigned && <option value="none">Unassigned</option>}
            </select>
            <select
              aria-label="Sort tasks"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={field}
            >
              <option value="due">Sort: due date</option>
              <option value="priority">Sort: priority</option>
              <option value="title">Sort: title A–Z</option>
            </select>
          </div>

          <FilterTabs tabs={tabs} value={filter} onChange={setFilter} label="Filter tasks" />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className={cn("rounded-full text-xs font-medium text-neutral-700 underline", focusRing)}
            >
              Clear search and filters
            </button>
          )}

          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-600">
              {tasksStatus === "error"
                ? "Tasks couldn't be loaded. See the message at the top of the page."
                : hasFilters
                  ? "No tasks match your search and filters."
                  : EMPTY[filter]}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
              {visible.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  detailed
                  highlight={task.id === lastAddedId}
                  onToggle={() => toggleTask(task.id)}
                 onCyclePriority={() => cyclePriority(task.id)}
onEditTitle={canEditFields ? (title) => editTask(task.id, { title }) : undefined}
onEditDue={canEditFields ? (due) => editTask(task.id, { due }) : undefined}
                  onDelete={canEdit ? () => deleteTask(task.id) : undefined}
                />
              ))}
            </ul>
          )}
        </div>
      </GlassCard>
    </>
  )
}