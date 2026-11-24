import { useEffect, useState } from "react"
import { Clock, Flame, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { getInitials } from "@/data/team"
import { dueLabel } from "@/lib/dates"
import { formatFullDate } from "@/lib/dateFormat"
import { focusRing, tile } from "@/lib/glass"
import { cn } from "@/lib/utils"
import PriorityPill from "./PriorityPill"

const toneStyles = {
  today: "font-medium text-orange-600",
  overdue: "font-medium text-red-600",
  soon: "text-amber-600",
  later: "text-neutral-500",
}

function statusChip(task, due) {
  if (task.done) return { text: "Done", className: "bg-emerald-100 text-emerald-800" }
  if (due.tone === "overdue") return { text: "Overdue", className: "bg-red-100 text-red-700" }
  if (due.tone === "today") return { text: "Due today", className: "bg-orange-100 text-orange-800" }
  return { text: "Upcoming", className: "bg-black/5 text-neutral-600" }
}

export default function TaskCard({
  task,
  onToggle,
  onCyclePriority,
  onDelete, // optional: no handler means no delete button
  highlight = false,
  detailed = false,
}) {
  const due = dueLabel(task.due)
  const status = statusChip(task, due)
  const [confirming, setConfirming] = useState(false)

  // If the user doesn't confirm within 3 seconds, go back to the normal icon
  useEffect(() => {
    if (!confirming) return
    const id = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(id)
  }, [confirming])

  return (
    <li
      id={`task-${task.id}`}
      className={cn(
        tile,
        "flex min-w-0 flex-col gap-3 p-3.5 transition-colors hover:bg-white/90",
        task.done && "bg-white/40",
        highlight && "ring-2 ring-neutral-900"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5 h-5 w-5 shrink-0 border-neutral-400 data-[checked]:border-neutral-900 data-[checked]:bg-neutral-900 data-[checked]:text-white data-[state=checked]:border-neutral-900 data-[state=checked]:bg-neutral-900 data-[state=checked]:text-white"
          checked={task.done}
          onCheckedChange={onToggle}
          aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
        />
        <p
          className={cn(
            "min-w-0 flex-1 break-words text-sm font-medium leading-snug text-neutral-900",
            task.done && "text-neutral-500 line-through"
          )}
        >
          {task.title}
        </p>
        {detailed && (
          <span className="shrink-0 rounded-md bg-black/5 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">
            {task.id}
          </span>
        )}
      </div>

      {/* pl-8 lines this row up under the title (checkbox 20px + gap 12px) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-8">
        <span className="rounded-full bg-lime-accent/70 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
          {task.service}
        </span>

        {detailed ? (
          <>
            <span className="text-xs text-neutral-600">{formatFullDate(task.due)}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
              {status.text}
            </span>
          </>
        ) : (
          !task.done && (
            <span className={cn("inline-flex items-center gap-1 text-xs", toneStyles[due.tone])}>
              {due.tone === "today" && <Flame className="h-3.5 w-3.5" />}
              {due.tone === "overdue" && <Clock className="h-3.5 w-3.5" />}
              {due.text}
            </span>
          )
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0" title={task.assignee?.name}>
            <AvatarImage src={task.assignee?.avatar} alt={task.assignee?.name} />
            <AvatarFallback className="bg-neutral-900 text-[10px] text-lime-accent">
              {task.assignee ? getInitials(task.assignee.name) : "?"}
            </AvatarFallback>
          </Avatar>
          {detailed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-neutral-800">
                {task.assignee?.name ?? "Unassigned"}
              </p>
              {task.assignee && (
                <p className="truncate text-[11px] text-neutral-500">{task.assignee.role}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <PriorityPill priority={task.priority} onCycle={onCyclePriority} />

          {/* Two-step delete: first tap asks, second tap deletes */}
          {onDelete && (
            <button
              type="button"
              onClick={() => (confirming ? onDelete() : setConfirming(true))}
              onBlur={() => setConfirming(false)}
              aria-label={confirming ? `Confirm delete "${task.title}"` : `Delete "${task.title}"`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full p-2 text-xs font-medium transition-colors",
                focusRing,
                confirming
                  ? "bg-red-500 px-3 text-white hover:bg-red-600"
                  : "text-neutral-400 hover:bg-black/5 hover:text-red-600"
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirming && "Delete?"}
            </button>
          )}
        </div>
      </div>
    </li>
  )
}