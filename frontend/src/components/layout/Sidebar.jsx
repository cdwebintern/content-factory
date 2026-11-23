import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { navGroups, serviceTags } from "@/data/nav"

// Shared by the desktop sidebar AND the mobile sheet
export function SidebarContent({ active, onSelect, tasksCount = 0 }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-black/5 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-900 font-bold text-lime-accent">
          <img src="/favicon.svg"   alt="Content Space Logo"
    className="h-6 w-6 object-contain"/>
        </div>
        <span className="text-lg font-semibold tracking-tight">Content Space</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-6 p-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-xs font-medium text-neutral-600">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
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
            <p className="mb-2 px-3 text-xs font-medium text-neutral-500">
              Service areas
            </p>
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