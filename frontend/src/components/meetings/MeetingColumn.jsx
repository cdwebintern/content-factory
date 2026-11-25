import { useState } from "react"
import GlassCard from "@/components/layout/GlassCard"
import { useNow } from "@/hooks/useNow"
import { dayLabel } from "@/lib/dates"
import { isMeetingOver } from "@/lib/meetingState"
import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"
import NextUpCard from "./NextUpCard"
import MeetingCard from "./MeetingCard"

const EARLIER_LIMIT = 3

export default function MeetingColumn({ meetings, loadError = false }) {
  // Re-renders every 30s so countdowns and "next up" stay current
  const now = useNow(30000)
  const [showAllEarlier, setShowAllEarlier] = useState(false)

  const byStart = [...meetings].sort((a, b) => a.start - b.start)
  const upcoming = byStart.filter((m) => !isMeetingOver(m, now)) // live or still to come
  const earlier = byStart.filter((m) => isMeetingOver(m, now)).reverse() // most recent first

  // The first upcoming meeting becomes the hero card; the rest are grouped by day
  const [next, ...later] = upcoming
  const groups = []
  for (const m of later) {
    const label = dayLabel(m.start)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(m)
    else groups.push({ label, items: [m] })
  }

  const shownEarlier = showAllEarlier ? earlier : earlier.slice(0, EARLIER_LIMIT)

  return (
    <GlassCard
      tone="warm"
      title="Upcoming meetings"
      description={upcoming.length === 0 ? "Nothing coming up" : `${upcoming.length} upcoming`}
    >
      <div className="space-y-4">
        {next ? (
          <NextUpCard meeting={next} />
        ) : (
          <p className="py-10 text-center text-sm text-ink-faint">
            {loadError
              ? "Meetings couldn't be loaded. See the message at the top of the page."
              : "No upcoming meetings 🎉"}
          </p>
        )}

        {groups.length > 0 && (
          <div className="max-h-105 space-y-4 overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.label} className="space-y-2">
                <p className="text-xs font-medium text-ink-faint">{g.label}</p>
                <ul className="space-y-2">
                  {g.items.map((m) => (
                    <MeetingCard key={m.id} meeting={m} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {earlier.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-faint">Earlier</p>
            <ul className="space-y-2">
              {shownEarlier.map((m) => (
                <MeetingCard key={m.id} meeting={m} past />
              ))}
            </ul>
            {earlier.length > EARLIER_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllEarlier((v) => !v)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent-ink",
                  focusRing
                )}
              >
                {showAllEarlier ? "Show fewer" : `Show all ${earlier.length}`}
              </button>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  )
}