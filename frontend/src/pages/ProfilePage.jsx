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
  away: { label: "Away", dot: "bg-slate-400" },
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/80 bg-white/60 p-3.5">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-neutral-900">{value}</dd>
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
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-neutral-900 text-3xl font-semibold text-lime-accent shadow-lg ring-4 ring-white/60">
            {getInitials(currentUser.name)}
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {currentUser.name}
            </h2>
            <p className="text-sm text-neutral-600">{currentUser.role}</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-medium text-neutral-800">
              <span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden />
              {status.label}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail label="Name" value={currentUser.name} />
          <Detail label="Role" value={currentUser.role} />
          <Detail label="Team member id" value={currentUser.id} />
          <Detail label="Workspace" value="Content Space" />
        </dl>

        <p className="mt-4 text-xs text-neutral-500">
          Editing your name and photo will arrive together with sign-in.
        </p>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Assigned to me" value={stats.total} />
        <StatTile label="Pending" value={stats.pending} />
        <StatTile label="Due today" value={stats.today} accent={stats.today > 0 ? "lime" : "neutral"} />
        <StatTile label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? "red" : "neutral"} />
        <StatTile label="Done" value={stats.done} />
      </div>

      <GlassCard
        tone="sky"
        title="Next meeting"
        action={<ViewAllLink to="/meetings">All meetings</ViewAllLink>}
      >
        {next ? (
          <div className="space-y-1">
            <p className="break-words text-base font-semibold text-neutral-900">{next.title}</p>
            <p className="text-sm text-neutral-700">
              {formatWhen(next.start)} · {untilLabel(next.start)}
            </p>
            <p className="text-sm text-neutral-600">{next.attendees || "No attendees listed"}</p>
          </div>
        ) : (
          <p className="text-sm text-neutral-600">No upcoming meetings.</p>
        )}
      </GlassCard>

      <Link
        to="/tasks"
        className={cn(
          "inline-flex w-fit rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-white",
          focusRing
        )}
      >
        See all tasks
      </Link>
    </>
  )
}