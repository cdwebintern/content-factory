import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

// One-tap switch between light and dark. The OS preference is what we start from.
export default function ThemeToggle({ className }) {
  const { resolved, setTheme } = useTheme()
  const dark = resolved === "dark"
  const label = dark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "group grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-glass-line bg-glass/60 text-ink-soft transition-colors duration-300 hover:border-accent-mist hover:bg-accent-soft hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong",
        className
      )}
    >
      {/* Both icons stay mounted so the swap can rotate and fade */}
      <span className="relative block h-4 w-4">
        <Sun
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-500 ease-out motion-reduce:transition-none",
            dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-500 ease-out motion-reduce:transition-none",
            dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        />
      </span>
    </button>
  )
}
