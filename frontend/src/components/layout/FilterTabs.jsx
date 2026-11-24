import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

// tabs: [{ id, label, count, alert? }]. Scrolls sideways on narrow screens.
export default function FilterTabs({ tabs, value, onChange, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const active = value === tab.id
        const alert = Boolean(tab.alert) && tab.count > 0 && !active

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              focusRing,
              active
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-white/80 bg-white/60 text-neutral-600 hover:bg-white",
              alert && "border-red-200 text-red-600"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                active ? "bg-lime-accent text-neutral-900" : alert ? "bg-red-50" : "bg-black/5"
              )}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}