import { Settings } from "lucide-react"
import SignInCard from "@/components/auth/SignInCard"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navGroups, serviceTags } from "@/data/nav"
import { getInitials } from "@/data/team"
import { useData } from "@/context/dataContext"
import { API_CONFIGURED } from "@/lib/api"
import { cn } from "@/lib/utils"
import ThemeToggle from "./ThemeToggle"

// Shared by the desktop sidebar AND the mobile sheet
export function SidebarContent({ active, onSelect, tasksCount = 0 }) {
  const { profile } = useData()
  const settingsActive = active === "settings"
  const profileActive = active === "profile"

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-accent-ink/5 px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-honey font-bold text-white shadow-sm shadow-accent-strong/30">
          C
        </div>
        <span className="min-w-0 flex-1 whitespace-nowrap text-base font-semibold tracking-tight text-ink">
          Content Factory
        </span>
        <ThemeToggle />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6 p-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-xs font-medium text-ink-faint">{group.title}</p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
                          isActive
                            ? "bg-gradient-to-r from-accent-strong to-accent-honey text-white shadow-sm shadow-accent-strong/25"
                            : "text-ink-soft hover:translate-x-0.5 hover:bg-accent-soft/70 hover:text-accent-ink"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-white" : group.accent === "green" ? "text-green" : "text-accent-strong/80"
                          )}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.id === "tasks" && tasksCount > 0 && (
                          <Badge className="h-5 min-w-5 justify-center bg-accent px-1.5 text-[11px] text-white hover:bg-accent">
                            {tasksCount}
                          </Badge>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div>
            <p className="mb-2 px-3 text-xs font-medium text-ink-faint">Service areas</p>
            <div className="flex flex-wrap gap-2 px-2">
              {serviceTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer border-glass-line bg-glass/60 font-normal transition-colors hover:border-accent-tint hover:bg-accent-soft hover:text-accent-ink"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* Settings and profile stay pinned to the bottom */}
      <div className="shrink-0 space-y-2 border-t border-accent-ink/5 p-4">
        {API_CONFIGURED && <SignInCard />}

        <button
          type="button"
          onClick={() => onSelect("settings")}
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
            settingsActive
              ? "bg-gradient-to-r from-accent-strong to-accent-honey text-white shadow-sm shadow-accent-strong/25"
              : "text-ink-soft hover:translate-x-0.5 hover:bg-accent-soft/70 hover:text-accent-ink"
          )}
        >
          <Settings className={cn("h-4 w-4", settingsActive ? "text-white" : "text-accent-strong/80")} />
          <span className="flex-1 text-left">Settings</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("profile")}
          aria-current={profileActive ? "page" : undefined}
          aria-label="Open your profile"
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border p-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
            profileActive
              ? "border-accent-strong bg-gradient-to-r from-accent-strong to-accent-honey text-white shadow-sm shadow-accent-strong/25"
              : "border-glass-line bg-glass/60 text-ink hover:-translate-y-0.5 hover:border-accent-mist hover:bg-glass"
          )}
        >
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
              profileActive ? "bg-glass text-accent-deep" : "bg-ink text-accent-mist"
            )}
          >
            {getInitials(profile.name)}
          </span>
          <span className="min-w-0 flex-1 text-left leading-tight">
            <span className="block truncate text-sm font-semibold">{profile.name}</span>
            <span
              className={cn("block truncate text-xs", profileActive ? "text-white/80" : "text-ink-muted")}
            >
              Profile · {profile.role}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ className, ...props }) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen w-64 shrink-0 border-r border-glass-line bg-glass/50 backdrop-blur-xl",
        className
      )}
    >
      <SidebarContent {...props} />
    </aside>
  )
}