import { currentUser } from "@/data/team"

// Settings are remembered on this device only.
const KEY = "content-space:settings:v1"
const PROFILE_DEFAULTS = {
  name: currentUser.name,
  role: currentUser.role,
  status: currentUser.status,
}
const DEFAULTS = { defaultMeetingLink: "", profile: PROFILE_DEFAULTS }
const STATUSES = ["online", "meeting", "away"]

const text = (value, fallback) =>
  typeof value === "string" && value.trim() ? value : fallback

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    const profile = parsed.profile ?? {}
    return {
      defaultMeetingLink:
        typeof parsed.defaultMeetingLink === "string" ? parsed.defaultMeetingLink : "",
      profile: {
        name: text(profile.name, PROFILE_DEFAULTS.name),
        role: text(profile.role, PROFILE_DEFAULTS.role),
        status: STATUSES.includes(profile.status) ? profile.status : PROFILE_DEFAULTS.status,
      },
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