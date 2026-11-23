export const PRIORITIES = ["low", "medium", "high", "urgent"]

// Low -> Medium -> High -> Urgent -> back to Low
export const nextPriority = (p) =>
  PRIORITIES[(PRIORITIES.indexOf(p) + 1) % PRIORITIES.length]