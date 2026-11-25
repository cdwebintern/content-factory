import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router"
import { X } from "lucide-react"
import AppBackground from "./AppBackground"
import DashboardSkeleton from "./DashboardSkeleton"
import MobileNav from "./MobileNav"
import Sidebar from "./Sidebar"
import SyncBar from "./SyncBar"
import SaveStatus from "./SaveStatus"
import { useData } from "@/context/dataContext"
import { navGroups } from "@/data/nav"
import { scrollToTop } from "@/lib/scroll"

// Sidebar items that open their own page
const ROUTES = {
  overview: "/",
  tasks: "/tasks",
  meetings: "/meetings",
  profile: "/profile",
  settings: "/settings",
}
// Sidebar items that scroll to a section of the home page
const SECTIONS = { team: "socials" }

const allNavItems = navGroups.flatMap((g) => g.items)

const navFromPath = (pathname) => {
  if (pathname.startsWith("/tasks")) return "tasks"
  if (pathname.startsWith("/meetings")) return "meetings"
  if (pathname.startsWith("/profile")) return "profile"
  if (pathname.startsWith("/settings")) return "settings"
  return "overview"
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { pathname } = location
  const scrollTarget = location.state?.scrollTo
  const { stats, loading, sources, refreshing, refreshAll } = useData()

  const [picked, setPicked] = useState({ path: "/", id: "overview" })
  const [notice, setNotice] = useState(null)

  // Highlight what was clicked on this page, otherwise follow the address
  const active = picked.path === pathname ? picked.id : navFromPath(pathname)

  // A new page starts at the top (unless we are headed for a section of the home page)
  useEffect(() => {
    if (!scrollTarget) window.scrollTo(0, 0)
  }, [pathname, scrollTarget])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(id)
  }, [notice])

  const handleNavSelect = (id) => {
    const route = ROUTES[id]
    const section = SECTIONS[id]

    if (route) {
      setNotice(null)
      setPicked({ path: route, id })
      if (route === pathname) scrollToTop()
      else navigate(route)
    } else if (section) {
      setNotice(null)
      setPicked({ path: "/", id })
      navigate("/", { state: { scrollTo: section }, replace: pathname === "/" })
    } else {
      const label = allNavItems.find((i) => i.id === id)?.label ?? "This page"
      setNotice(`${label} is coming soon. This demo only includes the overview, tasks and meetings.`)
    }
  }

  return (
    <div className="relative isolate flex min-h-screen overflow-x-clip">
      <AppBackground />
      <SaveStatus />

      {/* Desktop sidebar */}
      <Sidebar
        className="hidden lg:block"
        active={active}
        onSelect={handleNavSelect}
        tasksCount={stats.pending}
      />

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-accent-ink/10 bg-glass/85 px-4 shadow-sm backdrop-blur-xl lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav active={active} onSelect={handleNavSelect} tasksCount={stats.pending} />
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-honey font-bold text-white shadow-sm shadow-accent-strong/30">
                C
              </div>
              <span className="truncate text-base font-semibold tracking-tight text-ink">
                Content Factory
              </span>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-accent-strong/25">
            {stats.pending} {stats.pending === 1 ? "task" : "tasks"}
          </span>
        </header>

        <main className="mx-auto w-full max-w-350 space-y-6 p-4 md:p-8">
          {notice && (
            <div
              role="status"
              className="flex animate-in items-center justify-between gap-3 rounded-2xl border border-accent-tint bg-accent-soft/70 px-4 py-3 text-sm text-accent-dark backdrop-blur-xl fade-in"
            >
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
                className="rounded p-1 transition-colors hover:bg-accent-mist/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <SyncBar sources={sources} refreshing={refreshing} onRefresh={refreshAll} />

          {loading ? (
            <DashboardSkeleton variant={pathname === "/" ? "home" : "page"} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}