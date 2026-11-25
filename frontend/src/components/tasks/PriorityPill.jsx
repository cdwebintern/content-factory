import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/glass"

const styles = {
  low: "bg-ink/5 text-ink-muted hover:bg-ink/10",
  medium: "bg-accent-soft text-accent-burnt hover:bg-accent-mist",
  high: "bg-accent-mist text-accent-ink hover:bg-accent-tint",
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
        "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all duration-200 hover:-translate-y-0.5",
        focusRing,
        styles[priority]
      )}
    >
      {priority}
    </button>
  )
}