import { Clock, Users } from "lucide-react"
import { dayLabel, formatTime, minutesUntil, untilLabel } from "@/lib/dates"
import JoinButton from "./JoinButton"
import PriorityBadge from "./PriorityBadge"

export default function NextUpCard({ meeting }) {
  const live = minutesUntil(meeting.start) <= 0
  const startsText = live ? "In progress" : `Starts ${untilLabel(meeting.start)}`

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 rounded-3xl bg-gradient-to-br from-ink via-ink to-accent-dark p-4 text-white shadow-lg shadow-accent-ink/20 ring-1 ring-accent/20 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Pulsing badge: a ping circle layered behind a solid dot */}
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {live ? "LIVE NOW" : "NEXT UP"}
        </span>
        <span className="text-xs font-medium text-accent-tint">{startsText}</span>
      </div>

      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-white/70">{dayLabel(meeting.start)}</p>
        <p className="text-4xl font-light tracking-tight text-accent-tint">
          {formatTime(meeting.start)}
        </p>
        <h3 className="wrap-break-word text-base font-medium leading-snug">{meeting.title}</h3>
        {meeting.description && (
          <p className="wrap-break-word text-sm leading-snug text-white/70">{meeting.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 shrink-0" />
          {meeting.attendees || "No attendees listed"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0" />
          {meeting.durationMin} min · ends {formatTime(meeting.end)}
        </span>
        <PriorityBadge priority={meeting.priority} onDark />
      </div>

      {meeting.link && (
        <div className="mt-auto">
          <JoinButton href={meeting.link} size="lg" />
        </div>
      )}
    </div>
  )
}