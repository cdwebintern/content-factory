import GlassCard from "@/components/layout/GlassCard"
import { useNow } from "@/hooks/useNow"
import NextUpCard from "./NextUpCard"
import MeetingCard from "./MeetingCard"

export default function MeetingColumn({ meetings }) {
  // Re-renders every 30s so countdowns and "next up" stay current
  const now = useNow(30000)

  const sorted = [...meetings].sort((a, b) => new Date(a.start) - new Date(b.start))

  const isOver = (m) =>
    new Date(m.start).getTime() + m.durationMin * 60000 <= now.getTime()

  const upcoming = sorted.filter((m) => !isOver(m)) // live or still to come
  const earlier = sorted.filter(isOver)

  // First upcoming meeting becomes the hero card; the rest go in the list
  const [next, ...later] = upcoming

  return (
    <GlassCard
      title="Upcoming meetings"
      description={upcoming.length === 0 ? "All done for today" : `${upcoming.length} still to go`}
    >
      <div className="space-y-4">
        {next ? (
          <NextUpCard meeting={next} />
        ) : (
          <p className="py-10 text-center text-sm text-neutral-500">
            No more meetings today 🎉
          </p>
        )}

        {later.length > 0 && (
          <ul className="space-y-2">
            {later.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </ul>
        )}

        {earlier.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500">Earlier today</p>
            <ul className="space-y-2">
              {earlier.map((m) => (
                <MeetingCard key={m.id} meeting={m} past />
              ))}
            </ul>
          </div>
        )}
      </div>
    </GlassCard>
  )
}