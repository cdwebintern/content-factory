import { cn } from "@/lib/utils"

// Accent keys map to palette tokens; red is reserved for "needs attention",
// green for priority/upcoming and ok for completed.
const ACCENTS = {
  neutral: "bg-glass/65",
  accent: "bg-accent-mist/70",
  green: "bg-green-mist/60",
  "green-soft": "bg-green-soft/80",
  ok: "bg-ok-soft/80",
  red: "bg-danger-soft/80",
}

export default function StatTile({ label, value, accent = "neutral" }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-glass-line p-4 backdrop-blur-md transition-shadow hover:shadow-md hover:shadow-shade/5", ACCENTS[accent])}>
      <p className="text-3xl font-light leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 truncate text-xs font-medium text-ink-muted">{label}</p>
    </div>
  )
}