import { currentUser, team as defaultTeam } from "@/data/team"

// Settings are remembered on this device only.
const KEY = "content-space:settings:v1"
const STATUSES = ["online", "meeting", "away"]

// The original names and roles, used as the starting point and to reset back to
const defaultTeamMap = Object.fromEntries(
  defaultTeam.map(({ id, name, role }) => [id, { name, role }])
)

export { defaultTeamMap }

const DEFAULTS = {
  defaultMeetingLink: "",
  // Your name and role live in `team` (you are one of the members), so only
  // the status you set for yourself is stored separately
  profile: { status: currentUser.status },
  team: defaultTeamMap,
  // Members hidden on this device. You can always see yourself, so your id is never kept here
  teamRemoved: [],
  // Members added on this device, in the order they were added
  teamAdded: [],
}

const text = (value, fallback) =>
  typeof value === "string" && value.trim() ? value : fallback

// Older versions kept your name and role in `profile`. Those become the
// starting point for your own team entry, so earlier edits are not lost.
function teamFrom(stored, legacyProfile) {
  const out = {}
  for (const [id, defaults] of Object.entries(defaultTeamMap)) {
    const saved = stored?.[id] ?? {}
    const legacy = id === currentUser.id ? legacyProfile ?? {} : {}
    out[id] = {
      name: text(saved.name, text(legacy.name, defaults.name)),
      role: text(saved.role, text(legacy.role, defaults.role)),
    }
  }
  return out
}

// Added members are stored as they were typed, but only keep entries that
// still look like a member (an old or hand-edited value is simply dropped)
function addedFrom(stored) {
  if (!Array.isArray(stored)) return []
  return stored
    .filter(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.name === "string" &&
        m.name.trim() &&
        typeof m.role === "string" &&
        m.role.trim() &&
        !(m.id in defaultTeamMap)
    )
    .slice(0, 50)
    .map(({ id, name, role }) => ({ id, name: name.trim(), role: role.trim() }))
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      defaultMeetingLink:
        typeof parsed.defaultMeetingLink === "string" ? parsed.defaultMeetingLink : "",
      profile: {
        status: STATUSES.includes(parsed.profile?.status)
          ? parsed.profile.status
          : DEFAULTS.profile.status,
      },
      team: teamFrom(parsed.team, parsed.profile),
      teamRemoved: Array.isArray(parsed.teamRemoved)
        ? parsed.teamRemoved.filter(
            (id) => typeof id === "string" && id in defaultTeamMap && id !== currentUser.id
          )
        : [],
      teamAdded: addedFrom(parsed.teamAdded),
    }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Storage is blocked or full: the app keeps working, it just won't remember
  }
}
