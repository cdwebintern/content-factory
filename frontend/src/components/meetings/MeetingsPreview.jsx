import { Video } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import ViewAllLink from "@/components/layout/ViewAllLink"
import { useNow } from "@/hooks/useNow"
import { isMeetingOver } from "@/lib/meetingState"
import MeetingCard from "./MeetingCard"
import NextUpCard from "./NextUpCard"

const LIST_LIMIT = 3

// Home page card: the next meeting on the left, the following few on the right
export default function MeetingsPreview({ meetings, loadError = false }) {
  const now = useNow(30000) // keeps countdowns fresh

  const upcoming = meetings
    .filter((m) => !isMeetingOver(m, now))
    .sort((a, b) => a.start - b.start)
  const [next, ...later] = upcoming
  const shown = later.slice(0, LIST_LIMIT)

  return (
    <GlassCard
      tone="warm"
      icon={Video}
      title="Upcoming meetings"
      description={upcoming.length === 0 ? "Nothing coming up" : `${upcoming.length} upcoming`}
      action={<ViewAllLink to="/meetings">View all meetings</ViewAllLink>}
    >
      {next ? (
        <div className="grid gap-4 @lg:grid-cols-2">
          <NextUpCard meeting={next} />

          <div className="min-w-0 space-y-3">
            {shown.length === 0 ? (
              <p className="rounded-2xl border border-glass-line bg-glass/60 p-4 text-sm text-ink-muted">
                No other meetings coming up.
              </p>
            ) : (
              <ul className="space-y-3">
                {shown.map((m) => (
                  <MeetingCard key={m.id} meeting={m} now={now} />
                ))}
              </ul>
            )}
            {later.length > LIST_LIMIT && (
              <p className="text-xs text-ink-muted">
                +{later.length - LIST_LIMIT} more upcoming
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-ink-muted">
          {loadError
            ? "Meetings couldn't be loaded. See the message at the top of the page."
            : "No upcoming meetings 🎉"}
        </p>
      )}
    </GlassCard>
  )
}