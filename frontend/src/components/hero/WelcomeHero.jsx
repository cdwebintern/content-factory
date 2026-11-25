import { useGreeting } from "@/hooks/useGreeting"
import { useNow } from "@/hooks/useNow"
import { isMeetingOver, todaysMeetings } from "@/lib/meetingState"
import { glass } from "@/lib/glass"
import PersonaCard from "./PersonaCard"
import QuickPills from "./QuickPills"

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`

// Huge light-weight number with a small accent badge, like the reference
function BigStat({ value, label, badge }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1">
        <span className="text-4xl font-light leading-none tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {value}
        </span>
        {badge && (
          <span className="mt-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm shadow-accent-strong/25">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-muted">{label}</p>
    </div>
  )
}

export default function WelcomeHero({ user, stats, meetings }) {
  const now = useNow(30000) // keeps "Next sync" fresh
  const greeting = useGreeting(user.name.split(" ")[0])

  // First meeting that is live or still to come (skips completed and cancelled)
  const nextMeeting = [...meetings]
    .sort((a, b) => a.start - b.start)
    .find((m) => !isMeetingOver(m, now))

  const todays = todaysMeetings(meetings)
  const meetingsLeft = todays.filter((m) => !isMeetingOver(m, now)).length
  const dateText = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })

  return (
    <section className={`${glass} relative isolate overflow-hidden p-5 md:p-8`}>
      <div className="grid gap-8 md:grid-cols-[1fr_17rem] lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col justify-between gap-10">
          <div className="space-y-3">
            <p className="text-sm text-accent-burnt/70">{dateText}</p>
            <h1 className="text-4xl font-normal leading-tight tracking-tight text-ink md:text-5xl">
              {greeting}
            </h1>
            <p className="max-w-md text-sm text-ink-muted">
              You have {plural(todays.length, "meeting")} and {plural(stats.today, "task")} due today.
            </p>
            <div className="pt-2">
              <QuickPills nextMeeting={nextMeeting} highCount={stats.high} />
            </div>
          </div>

          {/* Big numbers */}
          <div className="grid max-w-xl grid-cols-3 gap-4">
            <BigStat
              value={stats.pending}
              label="Pending tasks"
              badge={`${stats.today} today`}
            />
            <BigStat
              value={todays.length}
              label="Meetings today"
              badge={`${meetingsLeft} left`}
            />
            <BigStat
              value={stats.high}
              label="High priority"
              badge={stats.overdue > 0 ? `${stats.overdue} overdue` : "on track"}
            />
          </div>
        </div>

        <PersonaCard user={user} />
      </div>
    </section>
  )
}