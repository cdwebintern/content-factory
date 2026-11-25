import { Link } from "react-router"
import GlassCard from "@/components/layout/GlassCard"
import PageHeader from "@/components/layout/PageHeader"
import StatTile from "@/components/layout/StatTile"
import ViewAllLink from "@/components/layout/ViewAllLink"
import { useData } from "@/context/dataContext"
import { currentUser, getInitials } from "@/data/team"
import { useNow } from "@/hooks/useNow"
import { formatWhen, untilLabel } from "@/lib/dates"
import { focusRing } from "@/lib/glass"
import { isMeetingOver } from "@/lib/meetingState"
import { getTaskStats } from "@/lib/taskStats"
import { cn } from "@/lib/utils"

const STATUS = {
  online: { label: "Online", dot: "bg-emerald-500" },
  meeting: { label: "In a meeting", dot: "bg-red-500" },
  away: { label: "Away", dot: "bg-ink-subtle" },
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/80 bg-white/60 p-3.5 transition-colors hover:border-accent-mist">
      <dt className="text-xs font-medium text-ink-faint">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function ProfilePage() {
  const { tasks, meetings } = useData()
  const now = useNow(30000)

  const mine = tasks.filter((t) => t.assignee?.id === currentUser.id)
  const stats = getTaskStats(mine)
  const next = meetings
    .filter((m) => !isMeetingOver(m, now))
    .sort((a, b) => a.start - b.start)[0]
  const status = STATUS[currentUser.status] ?? STATUS.away

  return (
    <>
      <PageHeader title="Profile" description="Your details and a quick look at your own work." />

      <GlassCard>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-honey text-3xl font-semibold text-white shadow-lg shadow-accent-ink/25 ring-4 ring-white/60">
            {getInitials(currentUser.name)}
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {currentUser.name}
            </h2>
            <p className="text-sm text-ink-muted">{currentUser.role}</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-medium text-ink-deep">
              <span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden />
              {status.label}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail label="Name" value={currentUser.name} />
          <Detail label="Role" value={currentUser.role} />
          <Detail label="Team member id" value={currentUser.id} />
          <Detail label="Workspace" value="Content Factory" />
        </dl>

        <p className="mt-4 text-xs text-ink-faint">
          Editing your name and photo will arrive together with sign-in.
        </p>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Assigned to me" value={stats.total} />
        <StatTile label="Pending" value={stats.pending} />
        <StatTile label="Due today" value={stats.today} accent={stats.today > 0 ? "accent" : "neutral"} />
        <StatTile label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? "red" : "neutral"} />
        <StatTile label="Done" value={stats.done} />
      </div>

      <GlassCard
        tone="warm"
        title="Next meeting"
        action={<ViewAllLink to="/meetings">All meetings</ViewAllLink>}
      >
        {next ? (
          <div className="space-y-1">
            <p className="break-words text-base font-semibold text-ink">{next.title}</p>
            <p className="text-sm text-ink-soft">
              {formatWhen(next.start)} · {untilLabel(next.start)}
            </p>
            <p className="text-sm text-ink-muted">{next.attendees || "No attendees listed"}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No upcoming meetings.</p>
        )}
      </GlassCard>

      <Link
        to="/tasks"
        className={cn(
          "hover-lift inline-flex w-fit rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-ink-deep hover:border-accent-mist hover:bg-white hover:text-accent-ink",
          focusRing
        )}
      >
        See all tasks
      </Link>
    </>
  )
}