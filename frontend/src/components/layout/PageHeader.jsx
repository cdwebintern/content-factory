import { ArrowLeft } from "lucide-react"
import { Link } from "react-router"
import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

export default function PageHeader({ title, description, action, backTo = "/", backLabel = "Dashboard" }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <Link
          to={backTo}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-2 text-xs font-medium text-neutral-700 backdrop-blur-md transition-colors hover:bg-white",
            focusRing
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-neutral-600">{description}</p>}
      </div>
      {action}
    </header>
  )
}