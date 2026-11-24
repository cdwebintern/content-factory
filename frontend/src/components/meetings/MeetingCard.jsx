import { Clock, Users } from "lucide-react"
import { dayLabel, formatTime } from "@/lib/dates"
import { formatFullDate } from "@/lib/dateFormat"
import { tile } from "@/lib/glass"
import { meetingPhase } from "@/lib/meetingState"
import { cn } from "@/lib/utils"
import JoinButton from "./JoinButton"
import PriorityBadge from "./PriorityBadge"

const PHASES = {
  live: { text: "Live now", className: "bg-red-100 text-red-700" },
  upcoming: { text: "Scheduled", className: "bg-sky-100 text-sky-800" },
  completed: { text: "Completed", className: "bg-emerald-100 text-emerald-800" },
  ended: { text: "Ended", className: "bg-black/5 text-neutral-600" },
  cancelled: { text: "Cancelled", className: "bg-red-100 text-red-700" },
}
const MUTED = ["completed", "ended", "cancelled"]

export default function MeetingCard({ meeting, now = new Date(), detailed = false, isNext = false }) {
  const phase = meetingPhase(meeting, now)
  const muted = MUTED.includes(phase)
  const status = PHASES[phase]
  const canJoin = !muted && Boolean(meeting.link)

  return (
    <li
      className={cn(
        tile,
        "flex min-w-0 flex-col gap-2.5 p-3.5",
        muted && "bg-white/40",
        isNext && "ring-2 ring-neutral-900"
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-sm font-semibold text-neutral-900">
          {formatTime(meeting.start)} – {formatTime(meeting.end)}
        </p>
        <span className="text-xs text-neutral-500">
          {detailed ? formatFullDate(meeting.start) : dayLabel(meeting.start)}
        </span>
        <span className="ml-auto">
          <PriorityBadge priority={meeting.priority} />
        </span>
      </div>

      {isNext && (
        <span className="w-fit rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-lime-accent">
          NEXT UP
        </span>
      )}

      <p
        className={cn(
          "break-words text-sm font-medium leading-snug text-neutral-900",
          muted && "text-neutral-500",
          phase === "cancelled" && "line-through"
        )}
      >
        {meeting.title}
      </p>

      {detailed && meeting.description && (
        <p className="break-words text-xs leading-snug text-neutral-600">{meeting.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3 shrink-0" />
          {meeting.attendees || "No attendees listed"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" />
          {meeting.durationMin} min
        </span>
      </div>

      {(detailed || canJoin) && (
        <div
          className={cn(
            "mt-auto flex flex-wrap items-center gap-2 border-t border-black/5 pt-2.5",
            detailed ? "justify-between" : "justify-end"
          )}
        >
          {detailed && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
              {status.text}
            </span>
          )}
          {canJoin && <JoinButton href={meeting.link} />}
        </div>
      )}
    </li>
  )
}