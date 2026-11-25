import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/glass"
import { getTaskStats, taskFilters } from "@/lib/taskStats"
import TaskCard from "./TaskCard"
import AddTaskForm from "./AddTaskForm"

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "high", label: "High Priority" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "all", label: "All" },
]

const EMPTY_MESSAGES = {
  pending: "Nothing pending. You're all caught up 🎉",
  high: "No high-priority tasks right now.",
  today: "Nothing due today.",
  overdue: "No overdue tasks. Nice work 🎉",
  all: "No tasks yet.",
}

export default function TaskColumn({
  tasks,
  onToggle,
  onCyclePriority,
  onAdd,
  onDelete,
  canEdit = true, // false when tasks come from the Google Sheet
  loadError = false,
}) {
  const [filter, setFilter] = useState("pending")
  const [adding, setAdding] = useState(false)
  const [lastAddedId, setLastAddedId] = useState(null)
  const stats = getTaskStats(tasks)

  const addTask = (task) => {
    onAdd(task)
    setAdding(false)
    setFilter("pending") // make sure the new task is visible
    setLastAddedId(task.id)
  }

  // After adding: scroll the new task into view, then drop the highlight
  useEffect(() => {
    if (!lastAddedId) return
    document
      .getElementById(`task-${lastAddedId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    const id = setTimeout(() => setLastAddedId(null), 2500)
    return () => clearTimeout(id)
  }, [lastAddedId])

  // Sort by due date only (stable), completed tasks last.
  const visible = tasks
    .filter(taskFilters[filter])
    .sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.due) - new Date(b.due))

  return (
    <GlassCard
      title="Tasks & priority"
      description={
        <>
          {stats.pending} pending
          {stats.overdue > 0 && (
            <span className="font-medium text-red-600"> · {stats.overdue} overdue</span>
          )}
        </>
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        {canEdit ? (
          adding ? (
            <AddTaskForm onAdd={addTask} onCancel={() => setAdding(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-accent-light/70 bg-white/40 py-2.5 text-sm font-medium text-ink-deep transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-wash hover:text-accent-ink",
                focusRing
              )}
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          )
        ) : (
          !loadError && (
            <p className="text-xs text-ink-faint">
              Tasks come from your Google Sheet. Ticks and priority changes made here stay on
              this device.
            </p>
          )
        )}

        {/* Filter tabs: scroll sideways on narrow screens */}
        <div
          role="tablist"
          aria-label="Filter tasks"
          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const count = tasks.filter(taskFilters[tab.id]).length
            const active = filter === tab.id
            const alert = tab.id === "overdue" && count > 0 && !active

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  focusRing,
                  active
                    ? "border-accent-strong bg-accent-strong text-white shadow-sm shadow-accent-ink/15"
                    : "border-white/80 bg-white/60 text-ink-muted hover:-translate-y-0.5 hover:border-accent-mist hover:bg-accent-wash hover:text-accent-ink",
                  alert && "border-red-200 text-red-600"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px]",
                    active
                      ? "bg-accent-soft text-accent-ink"
                      : alert
                        ? "bg-red-50"
                        : "bg-black/5"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <p className="grid flex-1 place-items-center py-10 text-center text-sm text-ink-faint">
            {loadError
              ? "Tasks couldn't be loaded. See the message at the top of the page."
              : EMPTY_MESSAGES[filter]}
          </p>
        ) : (
          <ul className="max-h-140 space-y-2 overflow-y-auto pr-1">
            {visible.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                highlight={task.id === lastAddedId}
                onToggle={() => onToggle(task.id)}
                onCyclePriority={() => onCyclePriority(task.id)}
                onDelete={canEdit ? () => onDelete(task.id) : undefined}
              />
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  )
}