import { CheckSquare, Video } from "lucide-react"

// Compact live pill. All numbers are passed in (derived in Dashboard).
export default function StatsStrip({ pending, meetingsToday, overdue }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-2 text-sm text-neutral-900 backdrop-blur-md sm:rounded-full">
      <span className="inline-flex items-center gap-1.5">
        <CheckSquare className="h-4 w-4" />
        <b>{pending}</b>
        <span className="text-neutral-500">Tasks</span>
      </span>

      <span className="inline-flex items-center gap-1.5">
        <Video className="h-4 w-4 text-blue-600" />
        <b>{meetingsToday}</b>
        <span className="text-neutral-500">Meetings today</span>
      </span>

      {/* Only shows when something is overdue */}
      {overdue > 0 && (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-2.5 py-0.5 font-medium text-red-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {overdue} Overdue
        </span>
      )}
    </div>
  )
}