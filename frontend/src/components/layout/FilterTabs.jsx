import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

// tabs: [{ id, label, count, alert? }]. Scrolls sideways on narrow screens.
export default function FilterTabs({ tabs, value, onChange, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
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
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-200",
              focusRing,
              active
                ? "border-accent-strong bg-accent-strong text-white shadow-sm shadow-shade/15"
                : "border-glass-line bg-glass/60 text-ink-muted hover:-translate-y-0.5 hover:border-accent-mist hover:bg-accent-wash hover:text-accent-ink",
              alert && "border-danger-border text-danger"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                active ? "bg-accent-soft text-accent-ink" : alert ? "bg-danger-soft" : "bg-ink/5"
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