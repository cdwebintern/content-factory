import { useState } from "react"
import { Flame } from "lucide-react"
import { celebrate } from "@/lib/confetti"
import { formatWhen, minutesUntil, untilLabel } from "@/lib/dates"
import { cn } from "@/lib/utils"

const pill = "rounded-full border border-glass-line bg-glass/70 backdrop-blur-md"

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
            <p className="truncate font-semibold text-ink">
              Next sync · {formatWhen(nextMeeting.start)}
            </p>
            <p className="truncate text-xs text-ink-faint">
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
              className="hover-lift shrink-0 rounded-full bg-accent-strong px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-shade/20 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-surface"
            >
              Join
            </a>
          )}
        </div>
      ) : (
        <div className={`${pill} px-4 py-2.5 text-sm text-ink-muted`}>
          No upcoming meetings
        </div>
      )}

      {/* 2. High-priority count */}
      <div className={`${pill} flex items-center gap-2 px-4 py-2.5 text-sm text-ink`}>
        <Flame className={highCount > 0 ? "h-4 w-4 text-accent" : "h-4 w-4 text-ink-subtle"} />
        {highCount > 0 ? (
          <span>
            <b>{highCount}</b> high-priority {highCount === 1 ? "task" : "tasks"}
          </span>
        ) : (
          <span className="text-ink-muted">No high-priority tasks</span>
        )}
      </div>

      {/* 3. High-five with confetti from the button's position */}
      <button
        type="button"
        onClick={(e) => {
          celebrate(e)
          setFives((n) => n + 1)
        }}
        className="hover-lift rounded-full bg-gradient-to-r from-accent to-accent-honey px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent-strong/30 transition hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-surface"
      >
        High-Five! 🙌{fives > 0 && <span className="ml-1.5 text-white/80">×{fives}</span>}
      </button>
    </div>
  )
}