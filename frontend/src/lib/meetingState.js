import { isToday } from "./dates"

// A meeting is "over" if it is completed, cancelled, or its end time has passed
export const isMeetingOver = (meeting, now = new Date()) =>
  meeting.status !== "scheduled" || meeting.end.getTime() <= now.getTime()

// Meetings happening today (cancelled ones don't count)
export const todaysMeetings = (meetings) =>
  meetings.filter((m) => m.status !== "cancelled" && isToday(m.start))

// "cancelled" | "completed" | "ended" | "live" | "upcoming"
export function meetingPhase(meeting, now = new Date()) {
  if (meeting.status === "cancelled") return "cancelled"
  if (meeting.status === "completed") return "completed"
  if (meeting.end <= now) return "ended"
  if (meeting.start <= now) return "live"
  return "upcoming"
}