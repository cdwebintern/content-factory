import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

export default function ViewAllLink({ to, children }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700",
        focusRing
      )}
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}