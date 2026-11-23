import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/glass"

export const PRIORITIES = ["low", "medium", "high", "urgent"]

// Low -> Medium -> High -> Urgent -> back to Low
export const nextPriority = (p) =>
  PRIORITIES[(PRIORITIES.indexOf(p) + 1) % PRIORITIES.length]

const styles = {
  low: "bg-black/5 text-neutral-600 hover:bg-black/10",
  medium: "bg-sky-100 text-sky-800 hover:bg-sky-200",
  high: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  urgent: "bg-red-500 text-white hover:bg-red-600",
}

// A real <button> so it works with keyboard (Tab + Enter/Space)
export default function PriorityPill({ priority, onCycle }) {
  return (
    <button
      type="button"
      onClick={onCycle}
      title="Click to change priority"
      aria-label={`Priority ${priority}. Click to change.`}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
        focusRing,
        styles[priority]
      )}
    >
      {priority}
    </button>
  )
}