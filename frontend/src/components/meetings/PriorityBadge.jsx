import { cn } from "@/lib/utils"

const lightStyles = {
  low: "bg-black/5 text-neutral-600",
  medium: "bg-sky-100 text-sky-800",
  high: "bg-orange-100 text-orange-800",
}
const darkStyles = {
  low: "bg-white/10 text-white/70",
  medium: "bg-white/15 text-white",
  high: "bg-lime-accent text-neutral-900",
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