import { useState } from "react"
import { Plus, Video } from "lucide-react"
import FilterTabs from "@/components/layout/FilterTabs"
import GlassCard from "@/components/layout/GlassCard"
import PageHeader from "@/components/layout/PageHeader"
import SearchField from "@/components/layout/SearchField"
import StatTile from "@/components/layout/StatTile"
import AddMeetingForm from "@/components/meetings/AddMeetingForm"
import MeetingCard from "@/components/meetings/MeetingCard"
import { useData } from "@/context/dataContext"
import { useNow } from "@/hooks/useNow"
import { dayLabel, isToday } from "@/lib/dates"
import { field } from "@/lib/formStyles"
import { focusRing } from "@/lib/glass"
import { isMeetingOver } from "@/lib/meetingState"
import { SHEET_CONFIGURED } from "@/lib/sheetsApi"
import { cn } from "@/lib/utils"

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "week", label: "Next 7 days" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
]

const EMPTY = {
  upcoming: "No upcoming meetings 🎉",
  today: "No meetings today.",
  week: "Nothing in the next 7 days.",
  completed: "No completed meetings yet.",
  cancelled: "No cancelled meetings.",
  all: "No meetings yet.",
}

// The list is already sorted, so meetings on the same day sit next to each other
function groupByDay(list) {
  const groups = []
  for (const m of list) {
    const label = dayLabel(m.start)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(m)
    else groups.push({ label, items: [m] })
  }
  return groups
}

export default function MeetingsPage() {
  const {
    meetings,
    meetingsStatus,
    canAddMeetings,
    canEditMeetings,
    defaultMeetingLink,
    addMeeting,
    editMeeting,
  } = useData()
  const now = useNow(30000)

  const [filter, setFilter] = useState("upcoming")
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState("all")
  const [adding, setAdding] = useState(false)

  const weekEnd = now.getTime() + 7 * 86400000

  const filters = {
    upcoming: (m) => !isMeetingOver(m, now),
    today: (m) => m.status !== "cancelled" && isToday(m.start),
    week: (m) => !isMeetingOver(m, now) && m.start.getTime() < weekEnd,
    completed: (m) => m.status === "completed" || (m.status === "scheduled" && m.end <= now),
    cancelled: (m) => m.status === "cancelled",
    all: () => true,
  }

  const tabs = TABS.map((t) => ({ ...t, count: meetings.filter(filters[t.id]).length }))
  const count = (id) => tabs.find((t) => t.id === id).count

  const next = meetings
    .filter(filters.upcoming)
    .sort((a, b) => a.start - b.start)[0]

  const q = query.trim().toLowerCase()
  const descending = filter === "completed" || filter === "cancelled" // most recent first
  const visible = meetings
    .filter(filters[filter])
    .filter((m) => priority === "all" || m.priority === priority)
    .filter(
      (m) =>
        !q ||
        [m.title, m.description, m.attendees, m.id].some((s) => s.toLowerCase().includes(q))
    )
    .sort((a, b) => (descending ? b.start - a.start : a.start - b.start))

  const groups = groupByDay(visible)
  const hasFilters = q !== "" || priority !== "all"
  const clearFilters = () => {
    setQuery("")
    setPriority("all")
  }

  const handleAdd = (payload) => {
    addMeeting(payload)
    setAdding(false)
    clearFilters()
    const [y, mo, d] = payload.date.split("-").map(Number)
    const [h, min] = payload.end.split(":").map(Number)
    const endDt = new Date(y, mo - 1, d, h, min)
    setFilter(endDt > new Date() ? "upcoming" : "all")
  }

  const addButton =
    canAddMeetings && !adding ? (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700",
          focusRing
        )}
      >
        <Plus className="h-4 w-4" />
        Add meeting
      </button>
    ) : null

  return (
    <>
      <PageHeader
        title="Meetings"
        description={
          !SHEET_CONFIGURED
            ? "Every meeting on your calendar: when it is, who is attending, how important it is and how to join."
            : canEditMeetings
              ? "Every meeting from your Google Sheet. New meetings and changes made here are saved back to the sheet."
              : "Every meeting from your Google Sheet. Set VITE_API_URL to add or edit meetings here."
        }
        action={addButton}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total meetings" value={meetings.length} />
        <StatTile label="Today" value={count("today")} accent={count("today") > 0 ? "lime" : "neutral"} />
        <StatTile label="Upcoming" value={count("upcoming")} />
        <StatTile label="Completed" value={count("completed")} />
        <StatTile label="Cancelled" value={count("cancelled")} accent={count("cancelled") > 0 ? "red" : "neutral"} />
      </div>

      <GlassCard
        tone="sky"
        icon={Video}
        title="All meetings"
        description={`Showing ${visible.length} of ${meetings.length}`}
      >
        <div className="space-y-4">
          {adding && (
            <AddMeetingForm
              defaultLink={defaultMeetingLink}
              onAdd={handleAdd}
              onCancel={() => setAdding(false)}
            />
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search by title, attendees or description"
              label="Search meetings"
            />
            <select
              aria-label="Filter by priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={field}
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <FilterTabs tabs={tabs} value={filter} onChange={setFilter} label="Filter meetings" />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className={cn("rounded-full text-xs font-medium text-neutral-700 underline", focusRing)}
            >
              Clear search and filters
            </button>
          )}

          {groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-600">
              {meetingsStatus === "error"
                ? "Meetings couldn't be loaded. See the message at the top of the page."
                : hasFilters
                  ? "No meetings match your search and filters."
                  : EMPTY[filter]}
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <section key={g.label} className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">{g.label}</h3>
                    <span className="text-xs text-neutral-500">
                      {g.items.length} {g.items.length === 1 ? "meeting" : "meetings"}
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
                    {g.items.map((m) => (
                      <MeetingCard
                        key={m.id}
                        meeting={m}
                        now={now}
                        detailed
                        isNext={next?.id === m.id}
                        onEdit={canEditMeetings ? (patch) => editMeeting(m.id, patch) : undefined}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </>
  )
}