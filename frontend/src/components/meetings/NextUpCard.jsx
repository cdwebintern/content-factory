import { Clock, Users } from "lucide-react"
import { formatTime, minutesUntil } from "@/lib/dates"
import JoinButton from "./JoinButton"

function countdown(mins) {
  if (mins <= 0) return "In progress"
  if (mins < 60) return `Starts in ${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `Starts in ${h}h${m ? ` ${m}m` : ""}`
}

export default function NextUpCard({ meeting }) {
  const mins = minutesUntil(meeting.start)
  const live = mins <= 0
  const end = new Date(new Date(meeting.start).getTime() + meeting.durationMin * 60000)

  return (
    <div className="space-y-4 rounded-3xl bg-neutral-900 p-5 text-white shadow-lg">
      <div className="flex items-center justify-between gap-2">
        {/* Pulsing badge: a ping circle layered behind a solid dot */}
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {live ? "LIVE NOW" : "NEXT UP"}
        </span>
        <span className="text-xs font-medium text-lime-accent">{countdown(mins)}</span>
      </div>

      <div className="space-y-1">
        <p className="text-5xl font-light tracking-tight text-lime-accent">
          {formatTime(meeting.start)}
        </p>
        <h3 className="text-base font-medium leading-snug">{meeting.title}</h3>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {meeting.participants} participants
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {meeting.durationMin} min · ends {formatTime(end)}
        </span>
      </div>

      <JoinButton href={meeting.link} size="lg" />
    </div>
  )
}