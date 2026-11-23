import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { tile } from "@/lib/glass"
import { formatTime } from "@/lib/dates"
import JoinButton from "./JoinButton"

export default function MeetingCard({ meeting, past = false }) {
  return (
    <li
      className={cn(
        tile,
        "flex items-center gap-3 p-3",
        past && "bg-white/40 text-neutral-500"
      )}
    >
      <div className="w-16 shrink-0 text-center">
        <p className="text-sm font-semibold text-neutral-900">{formatTime(meeting.start)}</p>
        <p className="text-[11px] text-neutral-500">{meeting.durationMin} min</p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-neutral-900">{meeting.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
          <Users className="h-3 w-3" />
          {meeting.participants} · {meeting.client}
        </p>
      </div>

      {past ? (
        <span className="shrink-0 text-xs">Done</span>
      ) : (
        <JoinButton href={meeting.link} className="shrink-0" />
      )}
    </li>
  )
}