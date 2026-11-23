import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { tile } from "@/lib/glass"
import { dayLabel, formatTime } from "@/lib/dates"
import JoinButton from "./JoinButton"
import PriorityBadge from "./PriorityBadge"

export default function MeetingCard({ meeting, past = false }) {
  const cancelled = meeting.status === "cancelled"

  return (
    <li className={cn(tile, "flex items-start gap-3 p-3", past && "bg-white/40")}>
      <div className="w-20 shrink-0 text-center">
        <p className="text-sm font-semibold text-neutral-900">{formatTime(meeting.start)}</p>
        <p className="text-[11px] text-neutral-500">{dayLabel(meeting.start)}</p>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "text-sm font-medium leading-snug text-neutral-900",
            (past || cancelled) && "text-neutral-500",
            cancelled && "line-through"
          )}
        >
          {meeting.title}
        </p>
        {meeting.description && (
          <p className="text-xs leading-snug text-neutral-500">{meeting.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {meeting.attendees || "No attendees listed"}
          </span>
          <span>· {meeting.durationMin} min</span>
          <PriorityBadge priority={meeting.priority} />
        </div>
      </div>

      <div className="shrink-0">
        {past ? (
          <span className={cn("text-xs", cancelled ? "font-medium text-red-600" : "text-neutral-500")}>
            {cancelled ? "Cancelled" : "Done"}
          </span>
        ) : (
          meeting.link && <JoinButton href={meeting.link} />
        )}
      </div>
    </li>
  )
}