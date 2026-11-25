// Only web links are accepted
export function isWebLink(text) {
  try {
    const url = new URL(String(text).trim())
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

// The link most meetings in the sheet use. When several links are used equally often
// (for example when every row has its own), the one that appears furthest down the
// sheet wins, because that is usually the most recently added meeting.
export function mostCommonLink(meetings) {
  const counts = new Map()

  meetings.forEach((m, index) => {
    if (!m.link) return
    const entry = counts.get(m.link) ?? { count: 0, lastIndex: -1 }
    entry.count += 1
    entry.lastIndex = index
    counts.set(m.link, entry)
  })

  let best = ""
  let bestEntry = null
  for (const [link, entry] of counts) {
    const better =
      !bestEntry ||
      entry.count > bestEntry.count ||
      (entry.count === bestEntry.count && entry.lastIndex > bestEntry.lastIndex)
    if (better) {
      best = link
      bestEntry = entry
    }
  }
  return best
}

// The link new meetings start with: the one chosen in Settings, otherwise the sheet's
export function resolveDefaultLink(meetings, override) {
  return isWebLink(override) ? override.trim() : mostCommonLink(meetings)
}