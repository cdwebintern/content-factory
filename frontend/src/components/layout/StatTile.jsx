import { cn } from "@/lib/utils"

// Accent keys map to palette tokens; red is reserved for "needs attention".
const ACCENTS = {
  neutral: "bg-white/65",
  accent: "bg-accent-mist/70",
  red: "bg-red-100/80",
}

export default function StatTile({ label, value, accent = "neutral" }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-white/80 p-4 backdrop-blur-md transition-shadow hover:shadow-md hover:shadow-accent-ink/5", ACCENTS[accent])}>
      <p className="text-3xl font-light leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-2 truncate text-xs font-medium text-ink-muted">{label}</p>
    </div>
  )
}