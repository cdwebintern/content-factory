import { CheckSquare } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import ViewAllLink from "@/components/layout/ViewAllLink"
import { getTaskStats, importantTasks } from "@/lib/taskStats"
import TaskCard from "./TaskCard"

const LIMIT = 6

// Home page card: the few most urgent tasks, laid out across the card
export default function TasksPreview({ tasks, onToggle, onCyclePriority, loadError = false }) {
  const stats = getTaskStats(tasks)
  const shown = importantTasks(tasks, LIMIT)

  return (
    <GlassCard
      tone="deep"
      icon={CheckSquare}
      title="Tasks & priority"
      description={
        <>
          {stats.pending} pending · {stats.today} due today
          {stats.overdue > 0 && (
            <span className="font-medium text-red-600"> · {stats.overdue} overdue</span>
          )}
        </>
      }
      action={<ViewAllLink to="/tasks">View all tasks</ViewAllLink>}
    >
      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">
          {loadError
            ? "Tasks couldn't be loaded. See the message at the top of the page."
            : "Nothing pending. You're all caught up 🎉"}
        </p>
      ) : (
        <>
          {/* Columns follow the card's width, not the screen's */}
          <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
            {shown.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => onToggle(task.id)}
                onCyclePriority={() => onCyclePriority(task.id)}
              />
            ))}
          </ul>
          {stats.pending > shown.length && (
            <p className="mt-3 text-xs text-ink-muted">
              Showing the {shown.length} most urgent of {stats.pending} pending tasks.
            </p>
          )}
        </>
      )}
    </GlassCard>
  )
}