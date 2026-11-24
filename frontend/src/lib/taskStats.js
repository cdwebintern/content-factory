import { isOverdue, isToday } from "./dates"

export const HIGH_PRIORITIES = ["high", "urgent"]
export const PRIORITY_RANK = { urgent: 3, high: 2, medium: 1, low: 0 }

// One source of truth for every filter (tabs, counts, stats)
export const taskFilters = {
  pending: (t) => !t.done,
  high: (t) => !t.done && HIGH_PRIORITIES.includes(t.priority),
  today: (t) => !t.done && isToday(t.due),
  overdue: (t) => !t.done && isOverdue(t.due),
  done: (t) => t.done,
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
    done: tasks.filter(taskFilters.done).length,
  }
}

// Pending tasks, most important first: overdue, then due today, then the rest,
// and inside each group by priority and then due date.
export function importantTasks(tasks, limit = 6) {
  const bucket = (t) => (isOverdue(t.due) ? 0 : isToday(t.due) ? 1 : 2)

  return tasks
    .filter(taskFilters.pending)
    .sort(
      (a, b) =>
        bucket(a) - bucket(b) ||
        PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
        a.due - b.due
    )
    .slice(0, limit)
}