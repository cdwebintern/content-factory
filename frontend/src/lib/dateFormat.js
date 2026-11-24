// "Mon, 23 Nov 2026"
export const formatFullDate = (date) =>
  new Date(date).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })