// Date helpers. All mock data is generated relative to "now",
// so Today / Overdue / "Starts in X min" always work.

export const addDays = (n = 0, hour = 17, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, minute, 0, 0)
  return d
}

export const inMinutes = (n) => new Date(Date.now() + n * 60000)

export const isToday = (date) =>
  new Date(date).toDateString() === new Date().toDateString()

// Overdue = the due DAY has fully passed (a task due today is not overdue)
export const isOverdue = (date) => {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end < new Date()
}

export const minutesUntil = (date) =>
  Math.round((new Date(date) - Date.now()) / 60000)

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Returns { text, tone } so the component decides icon + colour
export function dueLabel(date) {
  const diff = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000)
  if (diff === 0) return { text: "Today", tone: "today" }
  if (diff === 1) return { text: "Tomorrow", tone: "soon" }
  if (diff === -1) return { text: "Yesterday", tone: "overdue" }
  if (diff < 0) return { text: `${Math.abs(diff)} days overdue`, tone: "overdue" }
  return {
    text: new Date(date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }),
    tone: "later",
  }
}