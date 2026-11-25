import { cn } from "@/lib/utils"

const lightStyles = {
  low: "bg-ink/5 text-ink-muted",
  medium: "bg-accent-soft text-accent-burnt",
  high: "bg-accent-mist text-accent-ink",
}
const darkStyles = {
  low: "bg-white/10 text-white/70",
  medium: "bg-white/15 text-white",
  high: "bg-accent-light text-ink",
}

// Small read-only badge. Use onDark on the black "Next up" card.
export default function PriorityBadge({ priority, onDark = false }) {
  const styles = onDark ? darkStyles : lightStyles
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        styles[priority] ?? styles.medium
      )}
    >
      {priority}
    </span>
  )
}