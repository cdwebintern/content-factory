import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import AppBackground from "@/components/layout/AppBackground"
import Sidebar from "@/components/layout/Sidebar"
import MobileNav from "@/components/layout/MobileNav"
import DashboardSkeleton from "@/components/layout/DashboardSkeleton"
import SyncBar from "@/components/layout/SyncBar"
import WelcomeHero from "@/components/hero/WelcomeHero"
import NewsPulse from "@/components/news/NewsPulse"
import TaskColumn from "@/components/tasks/TaskColumn"
import MeetingColumn from "@/components/meetings/MeetingColumn"
import SocialColumn from "@/components/social/SocialColumn"
import { tasks as demoTasks } from "@/data/tasks"
import { meetings } from "@/data/meetings"
import { news } from "@/data/news"
import { posts } from "@/data/posts"
import { navGroups } from "@/data/nav"
import { team, currentUser } from "@/data/team"
import { useSheetTasks } from "@/hooks/useSheetTasks"
import { isToday } from "@/lib/dates"
import { applyLocal, loadLocal, saveLocal, withField } from "@/lib/localTasks"
import { nextPriority } from "@/lib/priority"
import { SHEET_CONFIGURED } from "@/lib/sheetTasks"
import { getTaskStats } from "@/lib/taskStats"

// Which nav item scrolls to which element id on this page.
// Nav items NOT listed here (clients, reports, ...) show a "coming soon" notice.
const SECTION_IDS = {
  overview: "overview",
  tasks: "tasks",
  meetings: "meetings",
  team: "socials",
}

const allNavItems = navGroups.flatMap((g) => g.items)

export default function Dashboard() {
  const sheet = useSheetTasks()
  const [local, setLocal] = useState(loadLocal)
  const [activeNav, setActiveNav] = useState("overview")
  const [notice, setNotice] = useState(null)

  // Base tasks come from the sheet, or from the demo data when no sheet is connected.
  // Local changes (ticks, priorities, and in demo mode adds/deletes) are layered on top.
  const baseTasks = SHEET_CONFIGURED ? sheet.tasks : demoTasks
  const tasks = useMemo(() => applyLocal(baseTasks, local), [baseTasks, local])
  const canEdit = !SHEET_CONFIGURED

  const stats = getTaskStats(tasks)
  const meetingsToday = meetings.filter((m) => isToday(m.start)).length

  // Remember local changes between visits
  useEffect(() => {
    saveLocal(local)
  }, [local])

  const changeField = (id, field, compute) =>
    setLocal((prev) => {
      const baseTask = [...baseTasks, ...prev.added].find((t) => t.id === id)
      return baseTask ? withField(prev, baseTask, field, compute) : prev
    })

  const toggleTask = (id) => changeField(id, "done", (done) => !done)
  const cyclePriority = (id) => changeField(id, "priority", nextPriority)

  const addTask = (task) => setLocal((prev) => ({ ...prev, added: [task, ...prev.added] }))

  const deleteTask = (id) =>
    setLocal((prev) => {
      const overrides = { ...prev.overrides }
      delete overrides[id]
      return prev.added.some((t) => t.id === id)
        ? { ...prev, overrides, added: prev.added.filter((t) => t.id !== id) }
        : { ...prev, overrides, deleted: [...prev.deleted, id] }
    })

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(id)
  }, [notice])

  const handleNavSelect = (id) => {
    setActiveNav(id)
    const targetId = SECTION_IDS[id]

    if (targetId) {
      setNotice(null)
      const el = document.getElementById(targetId)
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
    } else {
      const label = allNavItems.find((i) => i.id === id)?.label ?? "This page"
      setNotice(`${label} is coming soon. This demo only includes the overview.`)
    }
  }

  return (
    <div className="relative isolate flex min-h-screen">
      <AppBackground />

      {/* Desktop sidebar */}
      <Sidebar
        className="hidden lg:block"
        active={activeNav}
        onSelect={handleNavSelect}
        tasksCount={stats.pending}
      />

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-neutral-900/10 bg-white/85 px-4 shadow-sm backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <MobileNav active={activeNav} onSelect={handleNavSelect} tasksCount={stats.pending} />
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-900 font-bold text-lime-accent">
                C
              </div>
              <span className="text-base font-semibold tracking-tight text-neutral-900">
                Content Space
              </span>
            </div>
          </div>

          <span className="rounded-full bg-lime-accent px-3 py-1 text-xs font-semibold text-neutral-900">
            {stats.pending} {stats.pending === 1 ? "task" : "tasks"}
          </span>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
          {notice && (
            <div
              role="status"
              className="flex animate-in items-center justify-between gap-3 rounded-2xl border border-neutral-300 bg-lime-accent/30 px-4 py-3 text-sm text-neutral-900 backdrop-blur-xl fade-in"
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="rounded p-1 hover:bg-lime-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <SyncBar
            status={sheet.status}
            error={sheet.error}
            lastSynced={sheet.lastSynced}
            skipped={sheet.skipped}
            refreshing={sheet.refreshing}
            onRefresh={sheet.reload}
          />

          {sheet.status === "loading" ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div id="overview" className="scroll-mt-20">
                <WelcomeHero user={currentUser} stats={stats} meetings={meetings} />
              </div>

              {/* 3-column work suite: 1 col mobile, 2 on tablet, 3 on large desktop */}
              <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div id="tasks" className="scroll-mt-20">
                  <TaskColumn
                    tasks={tasks}
                    onToggle={toggleTask}
                    onCyclePriority={cyclePriority}
                    onAdd={addTask}
                    onDelete={deleteTask}
                    canEdit={canEdit}
                    loadError={sheet.status === "error"}
                  />
                </div>
                <div id="meetings" className="scroll-mt-20">
                  <MeetingColumn meetings={meetings} />
                </div>
                <div id="socials" className="scroll-mt-20 md:col-span-2 xl:col-span-1">
                  <SocialColumn posts={posts} team={team} currentUserId={currentUser.id} />
                </div>
              </div>

              {/* Daily news sits below the work suite */}
              <NewsPulse
                items={news}
                pending={stats.pending}
                meetingsToday={meetingsToday}
                overdue={stats.overdue}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}