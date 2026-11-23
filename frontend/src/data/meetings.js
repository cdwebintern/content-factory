import { inMinutes } from "@/lib/dates"

const make = (id, title, description, startInMin, durationMin, attendees, priority, status = "scheduled") => {
  const start = inMinutes(startInMin)
  return {
    id,
    title,
    description,
    start,
    end: new Date(start.getTime() + durationMin * 60000),
    durationMin,
    attendees,
    link: "https://zoom.us/j/81234567890",
    status,
    priority,
  }
}

// The second one starts in 25 min so "Next up" is always live in demo mode
export const meetings = [
  make("m0", "Internal standup", "Quick progress check", -180, 15, "Team Members", "low", "completed"),
  make("m1", "Weekly growth sync", "Review growth numbers with the client", 25, 45, "Client Team", "high"),
  make("m2", "Campaign review", "Go through campaign results", 210, 30, "Marketing Team", "medium"),
  make("m3", "Content calendar planning", "Plan next week's content", 330, 60, "Content Team", "medium"),
  make("m4", "Client follow-up", "Follow up on deliverables", 1500, 30, "Client Team", "low"),
]