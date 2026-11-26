import { useState } from "react"
import { Check, Database, Link2, Monitor, Moon, Palette, Pencil, Plus, RefreshCw, RotateCcw, Sun, Trash2, Users, X } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import PageHeader from "@/components/layout/PageHeader"
import { useData } from "@/context/dataContext"
import { getInitials } from "@/data/team"
import { API_CONFIGURED } from "@/lib/api"
import { field, fieldLabel } from "@/lib/formStyles"
import { useTheme } from "@/hooks/useTheme"
import { focusRing } from "@/lib/glass"
import { isWebLink } from "@/lib/meetingLink"
import { defaultTeamMap } from "@/lib/settings"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { cn } from "@/lib/utils"

const button =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200"

const quietButton = cn(
  button,
  "px-4 py-2 border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass"
)

// One team member: a read-only row until you press Edit, then a small form.
// Removing takes a second press, because it is the one action you can't undo by typing.
function MemberRow({ member, isYou, onSave, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState({ name: member.name, role: member.role })
  const [error, setError] = useState("")

  const startEdit = () => {
    setDraft({ name: member.name, role: member.role })
    setError("")
    setConfirming(false)
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setError("")
  }

  if (confirming) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 border-b border-accent-ink/5 py-3 last:border-b-0">
        <p className="min-w-0 flex-1 text-sm text-ink">
          Remove <span className="font-semibold">{member.name}</span> from this device?
          <span className="mt-0.5 block text-xs text-ink-muted">
            Their tasks keep their name. You can bring them back with Reset team.
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              onRemove()
              setConfirming(false)
            }}
            className={cn(button, "px-4 py-2 bg-red-500 text-white hover:bg-red-600", focusRing)}
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(quietButton, focusRing)}
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  const submit = (e) => {
    e.preventDefault()
    const name = draft.name.trim()
    const role = draft.role.trim()
    if (!name || !role) {
      setError("Name and role are both needed.")
      return
    }
    onSave({ name, role })
    setEditing(false)
  }

  if (!editing) {
    return (
      <li className="flex items-center gap-3 border-b border-accent-ink/5 py-2.5 last:border-b-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-burnt">
          {getInitials(member.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {member.name}
            {isYou && <span className="ml-1 text-xs font-normal text-ink-muted">(you)</span>}
          </p>
          <p className="truncate text-xs text-ink-muted">{member.role}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={startEdit}
            aria-label={`Edit ${member.name}`}
            title="Edit name and role"
            className={cn(
              "rounded-full p-2 text-ink-faint transition-colors hover:bg-accent-soft hover:text-accent-burnt",
              focusRing
            )}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!isYou && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Remove ${member.name}`}
              title="Remove from this device"
              className={cn(
                "rounded-full p-2 text-ink-faint transition-colors hover:bg-red-500/10 hover:text-red-500",
                focusRing
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </li>
    )
  }

  return (
    <li className="border-b border-accent-ink/5 py-3 last:border-b-0">
      <form
        onSubmit={submit}
        onKeyDown={(e) => e.key === "Escape" && cancel()}
        className="space-y-3"
        aria-label={`Edit ${member.name}`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`member-${member.id}-name`} className={fieldLabel}>
              Name
            </label>
            <input
              id={`member-${member.id}-name`}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              maxLength={60}
              className={field}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor={`member-${member.id}-role`} className={fieldLabel}>
              Role
            </label>
            <input
              id={`member-${member.id}-role`}
              value={draft.role}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
              maxLength={60}
              className={field}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className={cn(
              button,
              "px-4 py-2 bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent",
              focusRing
            )}
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className={cn(quietButton, focusRing)}
          >
            Cancel
          </button>
        </div>
      </form>
    </li>
  )
}

// Sits under the list for people who join the team later. It stays open after
// adding, so several names can be typed in a row.
function AddMemberForm({ onAdd, onCancel }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")

  const submit = (e) => {
    e.preventDefault()
    const cleanName = name.trim()
    const cleanRole = role.trim()
    if (!cleanName || !cleanRole) {
      setError("Add both a name and a role.")
      return
    }
    onAdd({ name: cleanName, role: cleanRole })
    setName("")
    setRole("")
    setError("")
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      className="mt-3 space-y-3 rounded-2xl border border-glass-line bg-glass/60 p-3"
      aria-label="Add team member"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-member-name" className={fieldLabel}>
            Name
          </label>
          <input
            id="new-member-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError("")
            }}
            maxLength={60}
            placeholder="e.g. Meera Nair"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="new-member-role" className={fieldLabel}>
            Role
          </label>
          <input
            id="new-member-role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              if (error) setError("")
            }}
            maxLength={60}
            placeholder="e.g. Copywriter"
            className={field}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className={cn(
            button,
            "px-4 py-2 bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent",
            focusRing
          )}
        >
          <Plus className="h-4 w-4" />
          Add member
        </button>
        <button type="button" onClick={onCancel} className={cn(quietButton, focusRing)}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-accent-ink/5 py-2.5 last:border-b-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    team,
    updateMember,
    addMember,
    removeMember,
    resetTeam,
    profile,
    defaultMeetingLink,
    resetLocal,
    sources,
    refreshAll,
    refreshing,
  } = useData()
  const { theme, setTheme } = useTheme()

  const [draft, setDraft] = useState(settings.defaultMeetingLink)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [editingTeam, setEditingTeam] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [confirmResetTeam, setConfirmResetTeam] = useState(false)

  // Something to reset when a name, a role or a member differs from the original list
  const teamChanged =
    settings.teamRemoved.length > 0 ||
    settings.teamAdded.length > 0 ||
    Object.entries(defaultTeamMap).some(([id, defaults]) => {
      const current = settings.team[id] ?? defaults
      return current.name !== defaults.name || current.role !== defaults.role
    })

  // Closing the editor also puts the add form away, so reopening starts on the list
  const closeTeam = () => {
    setEditingTeam(false)
    setAddingMember(false)
  }

  const usingOwnLink = isWebLink(settings.defaultMeetingLink)
  const lastSynced = sources
    .map((s) => s.lastSynced)
    .filter(Boolean)
    .reduce((a, b) => (a > b ? a : b), null)

  const saveLink = (e) => {
    e.preventDefault()
    const value = draft.trim()
    if (value && !isWebLink(value)) {
      setError("Enter a web address starting with https:// or http://")
      setSaved(false)
      return
    }
    setError("")
    updateSettings({ defaultMeetingLink: value })
    setDraft(value)
    setSaved(true)
  }

  const useSheetLink = () => {
    updateSettings({ defaultMeetingLink: "" })
    setDraft("")
    setError("")
    setSaved(true)
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Preferences for this device, and the status of your Google Sheets connection."
      />

      <GlassCard
        tone="soft"
        icon={Palette}
        title="Appearance"
        description="Light or dark. The choice is remembered on this device."
      >
        <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={theme === id}
              onClick={() => setTheme(id)}
              className={cn(
                button,
                "px-4 py-2",
                theme === id
                  ? "bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent"
                  : "border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
                focusRing
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard
        tone="deep"
        icon={Users}
        title="Team"
        description="Names and roles shown on the dashboard, in the team list and when assigning tasks."
      >
        {editingTeam ? (
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {team.length} {team.length === 1 ? "member" : "members"}
              </p>
              <button
                type="button"
                onClick={closeTeam}
                className={cn(
                  "rounded-full p-2 text-ink-faint transition-colors hover:bg-glass hover:text-ink",
                  focusRing
                )}
                aria-label="Close team editor"
                title="Done"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul>
              {team.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isYou={member.id === profile.id}
                  onSave={(patch) => updateMember(member.id, patch)}
                  onRemove={() => removeMember(member.id)}
                />
              ))}
            </ul>

            {addingMember && (
              <AddMemberForm onAdd={addMember} onCancel={() => setAddingMember(false)} />
            )}

            <p className="mt-4 text-xs text-ink-muted">
              Remembered on this device only. Your Google Sheet keeps the original names.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={closeTeam}
                className={cn(
                  button,
                  "bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent",
                  focusRing
                )}
              >
                <Check className="h-4 w-4" />
                Done
              </button>
              {!addingMember && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmResetTeam(false)
                    setAddingMember(true)
                  }}
                  className={cn(quietButton, focusRing)}
                >
                  <Plus className="h-4 w-4" />
                  Add member
                </button>
              )}
              {teamChanged && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmResetTeam) {
                      resetTeam()
                      setConfirmResetTeam(false)
                    } else {
                      setConfirmResetTeam(true)
                    }
                  }}
                  onBlur={() => setConfirmResetTeam(false)}
                  className={cn(
                    button,
                    "px-4 py-2",
                    confirmResetTeam
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
                    focusRing
                  )}
                >
                  {confirmResetTeam ? "Click again to reset" : "Reset team"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 -space-x-2" aria-hidden="true">
                {team.slice(0, 5).map((member) => (
                  <span
                    key={member.id}
                    className="grid h-8 w-8 place-items-center rounded-full border-2 border-glass bg-accent-soft text-[11px] font-semibold text-accent-burnt"
                  >
                    {getInitials(member.name)}
                  </span>
                ))}
                {team.length > 5 && (
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-glass bg-glass text-[11px] font-semibold text-ink-muted">
                    +{team.length - 5}
                  </span>
                )}
              </div>
              <p className="min-w-0 text-sm text-ink-muted">
                {team.length} {team.length === 1 ? "member" : "members"}
                {teamChanged && (
                  <span className="ml-1 text-xs text-ink-faint">· changed on this device</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingTeam(true)}
              className={cn(
                button,
                "border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
                focusRing
              )}
            >
              <Pencil className="h-4 w-4" />
              Edit team
            </button>
          </div>
        )}
      </GlassCard>

      <GlassCard
        tone="warm"
        icon={Link2}
        title="Meetings"
        description="The link a new meeting starts with. You can still change it for each meeting."
      >
        <form onSubmit={saveLink} className="space-y-4">
          <div>
            <label htmlFor="default-link" className={fieldLabel}>
              Default meeting link
            </label>
            <input
              id="default-link"
              type="url"
              inputMode="url"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setSaved(false)
              }}
              placeholder="https://zoom.us/j/..."
              aria-invalid={Boolean(error)}
              aria-describedby="default-link-help"
              className={field}
            />
            {error && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {error}
              </p>
            )}
            <p id="default-link-help" className="mt-2 text-xs text-ink-muted">
              {defaultMeetingLink ? (
                <>
                  New meetings start with{" "}
                  <span className="break-all font-medium text-accent-burnt">{defaultMeetingLink}</span>{" "}
                  ({usingOwnLink ? "your setting" : "the link most used in your sheet"}).
                </>
              ) : (
                "No meeting links found in your sheet yet. Set one here and new meetings will use it."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              className={cn(button, "hover-lift bg-accent-strong text-white shadow-sm shadow-shade/20 hover:bg-accent hover:shadow-md", focusRing)}
            >
              Save
            </button>
            {usingOwnLink && (
              <button
                type="button"
                onClick={useSheetLink}
                className={cn(
                  button,
                  "border border-glass-line bg-glass/70 text-ink-deep hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
                  focusRing
                )}
              >
                Use the sheet's link instead
              </button>
            )}
            {saved && (
              <span role="status" className="text-sm font-medium text-ok">
                Saved
              </span>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard
        tone="deep"
        icon={Database}
        title="Google Sheets connection"
        description="Where your tasks and meetings come from."
      >
        <dl>
          <Row
            label="Reading from Google Sheets"
            value={SHEET_CONFIGURED ? "Connected" : "Not connected (demo data)"}
          />
          <Row
            label="Saving changes to the sheet"
            value={
              SHEET_CONFIGURED && API_CONFIGURED
                ? "On"
                : SHEET_CONFIGURED
                  ? "Off (set VITE_API_URL to turn it on)"
                  : "Off"
            }
          />
          <Row
            label="Last synced"
            value={lastSynced ? lastSynced.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not yet"}
          />
        </dl>

        {SHEET_CONFIGURED && (
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className={cn(
              button,
              "mt-4 w-fit border border-glass-line bg-glass/80 text-ink hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass disabled:opacity-60",
              focusRing
            )}
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin motion-reduce:animate-none")}
            />
            {refreshing ? "Refreshing" : "Refresh now"}
          </button>
        )}
      </GlassCard>

      <GlassCard
        tone="tint"
        icon={RotateCcw}
        title="This device"
        description="Changes the dashboard only remembers on this device, such as ticks when saving is off and demo tasks."
      >
        <button
          type="button"
          onClick={() => {
            if (confirmReset) {
              resetLocal()
              setConfirmReset(false)
            } else {
              setConfirmReset(true)
            }
          }}
          onBlur={() => setConfirmReset(false)}
          className={cn(
            button,
            "w-fit",
            confirmReset
              ? "bg-red-500 text-white hover:bg-red-600"
              : "border border-glass-line bg-glass/80 text-ink hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass",
            focusRing
          )}
        >
          {confirmReset ? "Click again to reset" : "Reset device-only changes"}
        </button>
        <p className="mt-2 text-xs text-ink-muted">
          This never changes your Google Sheet.
        </p>
      </GlassCard>
    </>
  )
}