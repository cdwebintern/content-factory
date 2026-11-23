import { useEffect, useState } from "react"
import { Clock, Flame, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { focusRing, tile } from "@/lib/glass"
import { dueLabel } from "@/lib/dates"
import { getInitials } from "@/data/team"
import PriorityPill from "./PriorityPill"

const toneStyles = {
  today: "font-medium text-orange-600",
  overdue: "font-medium text-red-600",
  soon: "text-amber-600",
  later: "text-neutral-500",
}

export default function TaskCard({
  task,
  onToggle,
  onCyclePriority,
  onDelete, // optional: no handler means no delete button
  highlight = false,
}) {
  const due = dueLabel(task.due)
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
        "flex gap-3 p-3 transition-colors hover:bg-white/90",
        task.done && "bg-white/40",
        highlight && "ring-2 ring-neutral-900"
      )}
    >
      <Checkbox
        className="mt-0.5 border-neutral-400 data-checked:border-neutral-900 data-checked:bg-neutral-900 data-checked:text-white data-[state=checked]:border-neutral-900 data-[state=checked]:bg-neutral-900 data-[state=checked]:text-white"
        checked={task.done}
        onCheckedChange={onToggle}
        aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
      />

      {/* min-w-0 lets the text wrap fully instead of overflowing the card */}
      <div className="min-w-0 flex-1 space-y-2">
        <p
          className={cn(
            "text-sm font-medium leading-snug text-neutral-900",
            task.done && "text-neutral-500 line-through"
          )}
        >
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="rounded-full bg-lime-accent/70 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
            {task.service}
          </span>

          {!task.done && (
            <span className={cn("inline-flex items-center gap-1 text-xs", toneStyles[due.tone])}>
              {due.tone === "today" && <Flame className="h-3.5 w-3.5" />}
              {due.tone === "overdue" && <Clock className="h-3.5 w-3.5" />}
              {due.text}
            </span>
          )}

          {/* Two-step delete: first click asks, second click deletes */}
          {onDelete && (
            <button
              type="button"
              onClick={() => (confirming ? onDelete() : setConfirming(true))}
              onBlur={() => setConfirming(false)}
              aria-label={confirming ? `Confirm delete "${task.title}"` : `Delete "${task.title}"`}
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors",
                focusRing,
                confirming
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "text-neutral-400 hover:bg-black/5 hover:text-red-600"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirming && "Delete?"}
            </button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <PriorityPill priority={task.priority} onCycle={onCyclePriority} />
        <Avatar className="h-6 w-6" title={task.assignee?.name}>
          <AvatarImage src={task.assignee?.avatar} alt={task.assignee?.name} />
          <AvatarFallback className="bg-neutral-900 text-[10px] text-lime-accent">
            {task.assignee ? getInitials(task.assignee.name) : "?"}
          </AvatarFallback>
        </Avatar>
      </div>
    </li>
  )
}