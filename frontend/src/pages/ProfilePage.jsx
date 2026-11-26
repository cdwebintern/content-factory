import { useState } from "react"
import { Link } from "react-router"
import { Pencil, X } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import PageHeader from "@/components/layout/PageHeader"
import StatTile from "@/components/layout/StatTile"
import ViewAllLink from "@/components/layout/ViewAllLink"
import { useData } from "@/context/dataContext"
import { currentUser, getInitials } from "@/data/team"
import { useNow } from "@/hooks/useNow"
import { formatWhen, untilLabel } from "@/lib/dates"
import { focusRing } from "@/lib/glass"
import { field, fieldLabel } from "@/lib/formStyles"
import { isMeetingOver } from "@/lib/meetingState"
import { getTaskStats } from "@/lib/taskStats"
import { cn } from "@/lib/utils"

const STATUS = {
  online: { label: "Online", dot: "bg-emerald-500" },
  meeting: { label: "In a meeting", dot: "bg-red-500" },
  away: { label: "Away", dot: "bg-ink-subtle" },
}

const button =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200"

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-glass-line bg-glass/60 p-3.5 transition-colors hover:border-accent-mist">
      <dt className="text-xs font-medium text-ink-faint">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function ProfileForm({ profile, updateProfile, onClose }) {
  const [draft, setDraft] = useState({
    name: profile.name,
    role: profile.role,
    status: profile.status,
  })
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const change = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }))
    setSaved(false)
  }

  const save = (e) => {
    e.preventDefault()
    const name = draft.name.trim()
    const role = draft.role.trim()
    if (!name) {
      setError("Name cannot be empty")
      setSaved(false)
      return
    }
    if (name.length > 60) {
      setError("Name must be 60 characters or fewer")
      setSaved(false)
      return
    }
    if (role.length > 60) {
      setError("Role must be 60 characters or fewer")
      setSaved(false)
      return
    }
    setError("")
    setDraft({ name, role, status: draft.status })
    updateProfile({ name, role, status: draft.status })
    setSaved(true)
  }

  return (
    <GlassCard
      tone="soft"
      icon={Pencil}
      title="Edit profile"
      description="How your name and availability appear across the dashboard."
      action={
        <button
          type="button"
          onClick={onClose}
          className={cn(
            button,
            "border border-glass-line bg-glass/70 px-4 py-2 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
            focusRing
          )}
        >
          <X className="h-4 w-4" />
          Close
        </button>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className={fieldLabel}>
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={draft.name}
              onChange={(e) => change("name", e.target.value)}
              maxLength={60}
              aria-invalid={Boolean(error) && !draft.name.trim()}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="profile-role" className={fieldLabel}>
              Role
            </label>
            <input
              id="profile-role"
              type="text"
              value={draft.role}
              onChange={(e) => change("role", e.target.value)}
              maxLength={60}
              className={field}
            />
          </div>
        </div>

        <div>
          <span className={fieldLabel}>Status</span>
          <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-2">
            {Object.entries(STATUS).map(([id, { label, dot }]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={draft.status === id}
                onClick={() => change("status", id)}
                className={cn(
                  button,
                  "px-4 py-2",
                  draft.status === id
                    ? "bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent"
                    : "border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
                  focusRing
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    draft.status === id ? "bg-white" : dot
                  )}
                  aria-hidden
                />
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            className={cn(
              button,
              "hover-lift bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent hover:shadow-md",
              focusRing
            )}
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft({
                name: currentUser.name,
                role: currentUser.role,
                status: currentUser.status,
              })
              setError("")
              setSaved(false)
              updateProfile({
                name: currentUser.name,
                role: currentUser.role,
                status: currentUser.status,
              })
            }}
            className={cn(
              button,
              "border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
              focusRing
            )}
          >
            Reset to default
          </button>
          {saved && (
            <span role="status" className="text-sm font-medium text-ok">
              Saved
            </span>
          )}
        </div>

        <p className="text-xs text-ink-faint">
          Profile changes are remembered on this device only.
        </p>
      </form>
    </GlassCard>
  )
}

export default function ProfilePage() {
  const { tasks, meetings, profile, updateProfile } = useData()
  const [editing, setEditing] = useState(false)
  const now = useNow(30000)

  const mine = tasks.filter((t) => t.assignee?.id === profile.id)
  const stats = getTaskStats(mine)
  const next = meetings
    .filter((m) => !isMeetingOver(m, now))
    .sort((a, b) => a.start - b.start)[0]
  const status = STATUS[profile.status] ?? STATUS.away

  return (
    <>
      <PageHeader title="Profile" description="Your details and a quick look at your own work." />

      <GlassCard>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-honey text-3xl font-semibold text-white shadow-lg shadow-shade/25 ring-4 ring-glass-line">
            {getInitials(profile.name)}
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-expanded={editing}
              aria-controls="profile-edit-form"
              className={cn(
                button,
                "self-start border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass sm:ml-auto sm:self-auto",
                focusRing
              )}
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </button>
          )}
          <div className="min-w-0 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{profile.name}</h2>
            <p className="text-sm text-ink-muted">{profile.role}</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-glass-line bg-glass/70 px-3 py-1 text-xs font-medium text-ink-deep">
              <span className={cn("h-2 w-2 rounded-full", status.dot)} aria-hidden />
              {status.label}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <Detail label="Name" value={profile.name} />
          <Detail label="Role" value={profile.role} />
          <Detail label="Team member id" value={profile.id} />
          <Detail label="Workspace" value="Content Factory" />
        </dl>
      </GlassCard>

      {editing && (
        <div id="profile-edit-form">
          <ProfileForm
            profile={profile}
            updateProfile={updateProfile}
            onClose={() => setEditing(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Assigned to me" value={stats.total} />
        <StatTile label="Pending" value={stats.pending} accent={stats.pending > 0 ? "green-soft" : "neutral"} />
        <StatTile label="Due today" value={stats.today} accent={stats.today > 0 ? "accent" : "neutral"} />
        <StatTile label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? "red" : "neutral"} />
        <StatTile label="Done" value={stats.done} accent={stats.done > 0 ? "ok" : "neutral"} />
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
          "hover-lift inline-flex w-fit rounded-full border border-glass-line bg-glass/70 px-4 py-2.5 text-sm font-medium text-ink-deep hover:border-accent-mist hover:bg-glass hover:text-accent-ink",
          focusRing
        )}
      >
        See all tasks
      </Link>
    </>
  )
}
