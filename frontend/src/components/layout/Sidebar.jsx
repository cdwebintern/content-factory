import { Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navGroups, serviceTags } from "@/data/nav"
import { currentUser, getInitials } from "@/data/team"
import { cn } from "@/lib/utils"

// Shared by the desktop sidebar AND the mobile sheet
export function SidebarContent({ active, onSelect, tasksCount = 0 }) {
  const settingsActive = active === "settings"
  const profileActive = active === "profile"

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-black/5 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-900 font-bold text-lime-accent">
          C
        </div>
        <span className="text-lg font-semibold tracking-tight">Content Factory</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6 p-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-xs font-medium text-neutral-600">{group.title}</p>
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
                          "flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
                          isActive
                            ? "bg-neutral-900 text-white shadow-sm"
                            : "text-neutral-700 hover:bg-white/70 hover:text-neutral-900"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.id === "tasks" && tasksCount > 0 && (
                          <Badge className="h-5 min-w-5 justify-center bg-lime-accent px-1.5 text-[11px] text-neutral-900 hover:bg-lime-accent">
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
            <p className="mb-2 px-3 text-xs font-medium text-neutral-600">Service areas</p>
            <div className="flex flex-wrap gap-2 px-2">
              {serviceTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer border-black/10 bg-white/60 font-normal hover:bg-lime-accent"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* Settings and profile stay pinned to the bottom */}
      <div className="shrink-0 space-y-2 border-t border-black/5 p-4">
        <button
          type="button"
          onClick={() => onSelect("settings")}
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
            settingsActive
              ? "bg-neutral-900 text-white shadow-sm"
              : "text-neutral-700 hover:bg-white/70 hover:text-neutral-900"
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="flex-1 text-left">Settings</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("profile")}
          aria-current={profileActive ? "page" : undefined}
          aria-label="Open your profile"
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
            profileActive
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-white/80 bg-white/60 text-neutral-900 hover:bg-white"
          )}
        >
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
              profileActive ? "bg-lime-accent text-neutral-900" : "bg-neutral-900 text-lime-accent"
            )}
          >
            {getInitials(currentUser.name)}
          </span>
          <span className="min-w-0 flex-1 text-left leading-tight">
            <span className="block truncate text-sm font-semibold">{currentUser.name}</span>
            <span
              className={cn("block truncate text-xs", profileActive ? "text-white/70" : "text-neutral-600")}
            >
              Profile · {currentUser.role}
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
        "sticky top-0 h-screen w-64 shrink-0 border-r border-white/60 bg-white/40 backdrop-blur-xl",
        className
      )}
    >
      <SidebarContent {...props} />
    </aside>
  )
}