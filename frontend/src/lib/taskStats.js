import { isOverdue, isToday } from "./dates"

export const HIGH_PRIORITIES = ["high", "urgent"]

// One source of truth for every filter (tabs, counts, stats)
export const taskFilters = {
  pending: (t) => !t.done,
  high: (t) => !t.done && HIGH_PRIORITIES.includes(t.priority),
  today: (t) => !t.done && isToday(t.due),
  overdue: (t) => !t.done && isOverdue(t.due),
  all: () => true,
}

// Derived numbers. Never store these in state, always compute from tasks.
export function getTaskStats(tasks) {
  return {
    total: tasks.length,
    pending: tasks.filter(taskFilters.pending).length,
    high: tasks.filter(taskFilters.high).length,
    today: tasks.filter(taskFilters.today).length,
    overdue: tasks.filter(taskFilters.overdue).length,
  }
}