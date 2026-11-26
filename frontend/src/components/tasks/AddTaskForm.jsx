import { useState } from "react"
import { X } from "lucide-react"
import { currentUser } from "@/data/team"
import { serviceTags } from "@/data/nav"
import { useData } from "@/context/dataContext"
import { field, fieldLabel } from "@/lib/formStyles"
import { focusRing } from "@/lib/glass"
import { PRIORITIES } from "@/lib/priority"
import { cn } from "@/lib/utils"

// <input type="date"> wants "YYYY-MM-DD" in LOCAL time
const toInputDate = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function AddTaskForm({ onAdd, onCancel }) {
  const { team } = useData()
  const [title, setTitle] = useState("")
  const [service, setService] = useState(serviceTags[0])
  const [due, setDue] = useState(toInputDate())
  const [priority, setPriority] = useState("medium")
  const [assigneeId, setAssigneeId] = useState(currentUser.id)
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) {
      setError("Please enter a task title.")
      return
    }

    // Build a real Date (5 PM local) so Today / Overdue logic keeps working
    const [y, m, d] = due.split("-").map(Number)

    onAdd({
      id: `t-${Date.now()}`,
      title: clean,
      service,
      due: new Date(y, m - 1, d, 17, 0, 0, 0),
      priority,
      done: false,
      assignee: team.find((m) => m.id === assigneeId),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="space-y-3 rounded-2xl border border-glass-line bg-glass/70 p-4 shadow-sm shadow-shade/5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">New task</h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className={cn("rounded-full p-2 text-ink-faint transition-colors hover:bg-accent-soft hover:text-accent-burnt", focusRing)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label htmlFor="new-task-title" className={fieldLabel}>
          Title
        </label>
        <input
          id="new-task-title"
          autoFocus
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (error) setError("")
          }}
          placeholder="e.g. Send content calendar to Peak Fitness"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "new-task-error" : undefined}
          className={field}
        />
        {error && (
          <p id="new-task-error" role="alert" className="mt-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="new-task-service" className={fieldLabel}>
            Service
          </label>
          <select
            id="new-task-service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={field}
          >
            {serviceTags.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="new-task-due" className={fieldLabel}>
            Due date
          </label>
          <input
            id="new-task-due"
            type="date"
            required
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div>
        <label htmlFor="new-task-assignee" className={fieldLabel}>
          Assign to
        </label>
        <select
          id="new-task-assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={field}
        >
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.id === currentUser.id ? " (You)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={fieldLabel}>Priority</span>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-accent-ink/5 p-1 sm:grid-cols-4 sm:rounded-full">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={priority === p}
              onClick={() => setPriority(p)}
              className={cn(
                "rounded-full px-2 py-2 text-xs font-medium capitalize transition-all duration-200",
                focusRing,
                priority === p
                  ? "bg-accent-strong text-white shadow-sm shadow-shade/20"
                  : "text-ink-muted hover:bg-accent-soft/70 hover:text-accent-ink"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "rounded-full border border-glass-line bg-glass/70 px-4 py-2.5 text-sm font-medium text-ink-soft transition-all hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass hover:text-accent-ink",
            focusRing
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={cn(
            "hover-lift rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-shade/20 hover:bg-accent",
            focusRing
          )}
        >
          Add task
        </button>
      </div>
    </form>
  )
}