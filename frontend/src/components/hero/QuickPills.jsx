import { useState } from "react"
import { Flame } from "lucide-react"
import { celebrate } from "@/lib/confetti"
import { formatWhen, minutesUntil, untilLabel } from "@/lib/dates"
import { cn } from "@/lib/utils"

const pill = "rounded-full border border-white/80 bg-white/70 backdrop-blur-md"

export default function QuickPills({ nextMeeting, highCount }) {
  const [fives, setFives] = useState(0)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 1. Next sync + Join */}
      {nextMeeting ? (
        <div
          className={cn(
            pill,
            "flex max-w-full items-center gap-3 py-1.5 pl-4",
            nextMeeting.link ? "pr-1.5" : "pr-4"
          )}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 text-sm leading-tight">
            <p className="truncate font-semibold text-neutral-900">
              Next sync · {formatWhen(nextMeeting.start)}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {minutesUntil(nextMeeting.start) <= 0
                ? "In progress"
                : untilLabel(nextMeeting.start)}{" "}
              · {nextMeeting.attendees || nextMeeting.title}
            </p>
          </div>
          {nextMeeting.link && (
            <a
              href={nextMeeting.link}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Join
            </a>
          )}
        </div>
      ) : (
        <div className={`${pill} px-4 py-2.5 text-sm text-neutral-600`}>
          No upcoming meetings
        </div>
      )}

      {/* 2. High-priority count */}
      <div className={`${pill} flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-900`}>
        <Flame className={highCount > 0 ? "h-4 w-4 text-orange-500" : "h-4 w-4 text-neutral-400"} />
        {highCount > 0 ? (
          <span>
            <b>{highCount}</b> high-priority {highCount === 1 ? "task" : "tasks"}
          </span>
        ) : (
          <span className="text-neutral-600">No high-priority tasks</span>
        )}
      </div>

      {/* 3. High-five with confetti from the button's position */}
      <button
        type="button"
        onClick={(e) => {
          celebrate(e)
          setFives((n) => n + 1)
        }}
        className="rounded-full border border-neutral-900/10 bg-lime-accent px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:brightness-95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
      >
        High-Five! 🙌{fives > 0 && <span className="ml-1.5 text-neutral-600">×{fives}</span>}
      </button>
    </div>
  )
}