import { useEffect, useRef, useState } from "react"
import { Clock, Flame, Pencil, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { getInitials } from "@/data/team"
import { dueLabel } from "@/lib/dates"
import { formatFullDate } from "@/lib/dateFormat"
import { focusRing, tile } from "@/lib/glass"
import { isValidYMD, toYMD } from "@/lib/taskEdits"
import { cn } from "@/lib/utils"
import PriorityPill from "./PriorityPill"

const toneStyles = {
  today: "font-medium text-accent-strong",
  overdue: "font-medium text-danger",
  soon: "text-accent-strong",
  later: "text-ink-faint",
}

function statusChip(task, due) {
  if (task.done) return { text: "Done", className: "bg-ok-soft text-ok" }
  if (due.tone === "overdue") return { text: "Overdue", className: "bg-danger-soft text-danger" }
  if (due.tone === "today") return { text: "Due today", className: "bg-accent-soft text-accent-burnt" }
  return { text: "Upcoming", className: "bg-accent-ink/5 text-ink-muted" }
}

export default function TaskCard({
  task,
  onToggle,
  onCyclePriority,
  onDelete, // optional: no handler means no delete button
  onEditTitle, // optional: (newTitle) => void, adds the pencil
  onEditDue, // optional: ("yyyy-mm-dd") => void, adds a date picker in detailed cards
  highlight = false,
  detailed = false,
}) {
  const due = dueLabel(task.due)
  const status = statusChip(task, due)
  const [confirming, setConfirming] = useState(false)

  // Title editing: Enter or clicking away saves, Escape cancels
  const [editingTitle, setEditingTitle] = useState(false)
  const [draft, setDraft] = useState("")
  const finished = useRef(false) // stops Enter + blur from saving twice

  // Date editing keeps what is typed until the date is complete and valid
  const [dateDraft, setDateDraft] = useState(null)

  // If the user doesn't confirm within 3 seconds, go back to the normal icon
  useEffect(() => {
    if (!confirming) return
    const id = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(id)
  }, [confirming])

  const startEditing = () => {
    finished.current = false
    setDraft(task.title)
    setEditingTitle(true)
  }

  const finishEditing = (save) => {
    if (finished.current) return
    finished.current = true
    setEditingTitle(false)

    const clean = draft.trim()
    if (save && clean && clean !== task.title) onEditTitle(clean)
  }

  const handleDateChange = (value) => {
    setDateDraft(value)
    if (isValidYMD(value) && value !== toYMD(task.due)) onEditDue(value)
  }

  return (
    <li
      id={`task-${task.id}`}
      className={cn(
        tile,
        "flex min-w-0 flex-col gap-3 border-2 border-accent-ink/15 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-tint/70 hover:bg-glass/90 hover:shadow-md hover:shadow-shade/10",
        task.done && "bg-glass/40",
        highlight && "ring-2 ring-accent-strong"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5 h-5 w-5 shrink-0 border-accent-light data-checked:border-accent-strong data-checked:bg-accent-strong data-checked:text-white data-[state=checked]:border-accent-strong data-[state=checked]:bg-accent-strong data-[state=checked]:text-white"
          checked={task.done}
          onCheckedChange={onToggle}
          aria-label={`Mark "${task.title}" as ${task.done ? "not done" : "done"}`}
        />

        {editingTitle ? (
          <input
            autoFocus
            value={draft}
            maxLength={120}
            aria-label="Task title"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                finishEditing(true)
              } else if (e.key === "Escape") {
                e.preventDefault()
                finishEditing(false)
              }
            }}
            onBlur={() => finishEditing(true)}
            className="min-w-0 flex-1 rounded-lg border border-accent-ink/20 bg-glass px-2 py-1 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong sm:text-sm"
          />
        ) : (
          <>
            <p
              className={cn(
                "min-w-0 flex-1 wrap-break-word text-sm font-medium leading-snug text-ink",
                task.done && "text-ink-faint line-through"
              )}
            >
              {task.title}
            </p>
            {/* {detailed && (
              <span className="shrink-0 rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[11px] text-ink-faint">
                {task.id}
              </span>
            )} */}
            {onEditTitle && (
              <button
                type="button"
                onClick={startEditing}
                aria-label={`Edit title of "${task.title}"`}
                className={cn(
                  "shrink-0 rounded-full p-2 text-ink-subtle transition-colors hover:bg-accent-soft hover:text-accent-burnt",
                  focusRing
                )}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* pl-8 lines this row up under the title (checkbox 20px + gap 12px) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-8">
        <span className="rounded-full bg-accent-soft/90 px-2.5 py-0.5 text-xs font-medium text-accent-ink">
          {task.service}
        </span>

        {detailed ? (
          <>
            {onEditDue ? (
              <label className="inline-flex items-center">
                <span className="sr-only">Due date</span>
                <input
                  type="date"
                  value={dateDraft ?? toYMD(task.due)}
                  min="2000-01-01"
                  max="2100-12-31"
                  onChange={(e) => handleDateChange(e.target.value)}
                  onBlur={() => setDateDraft(null)}
                  className="min-w-0 rounded-lg border border-glass-line bg-glass/80 px-2 py-1 text-base text-ink-deep transition-colors hover:border-accent-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong sm:text-xs"
                />
              </label>
            ) : (
              <span className="text-xs text-ink-muted">{formatFullDate(task.due)}</span>
            )}
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

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-accent-ink/5 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0" title={task.assignee?.name}>
            <AvatarImage src={task.assignee?.avatar} alt={task.assignee?.name} />
            <AvatarFallback className="bg-ink text-[10px] text-accent-mist">
              {task.assignee ? getInitials(task.assignee.name) : "?"}
            </AvatarFallback>
          </Avatar>
          {detailed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium text-ink-deep">
                {task.assignee?.name ?? "Unassigned"}
              </p>
              {task.assignee && (
                <p className="truncate text-[11px] text-ink-faint">{task.assignee.role}</p>
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
                  : "text-ink-subtle hover:bg-danger-soft hover:text-danger"
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