import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

export default function ViewAllLink({ to, children }) {
  return (
    <Link
      to={to}
      className={cn(
        "group hover-lift inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-strong px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-accent-ink/20 hover:bg-accent hover:shadow-md",
        focusRing
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
