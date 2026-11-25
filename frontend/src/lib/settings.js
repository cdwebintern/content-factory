// Settings are remembered on this device only.
const KEY = "content-space:settings:v1"
const DEFAULTS = { defaultMeetingLink: "" }

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      defaultMeetingLink:
        typeof parsed.defaultMeetingLink === "string" ? parsed.defaultMeetingLink : "",
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