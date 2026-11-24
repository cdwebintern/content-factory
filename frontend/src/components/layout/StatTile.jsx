import { cn } from "@/lib/utils"

const ACCENTS = {
  neutral: "bg-white/65",
  lime: "bg-lime-accent/50",
  red: "bg-red-100/80",
}

export default function StatTile({ label, value, accent = "neutral" }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-white/80 p-4 backdrop-blur-md", ACCENTS[accent])}>
      <p className="text-3xl font-light leading-none tracking-tight text-neutral-900">{value}</p>
      <p className="mt-2 truncate text-xs font-medium text-neutral-600">{label}</p>
    </div>
  )
}