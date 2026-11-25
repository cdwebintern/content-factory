import { Video } from "lucide-react"
import { cn } from "@/lib/utils"

// size "lg" = big full-width button (hero card), "sm" = compact (list cards)
export default function JoinButton({ href, size = "sm", className }) {
  const large = size === "lg"

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "hover-lift inline-flex items-center justify-center gap-2 rounded-lg bg-accent-strong font-medium text-white shadow-sm shadow-accent-ink/20 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2",
        large ? "w-full px-4 py-3 text-sm" : "px-4 py-2 text-xs",
        className
      )}
    >
      <Video className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {large ? "Join Meeting" : "Join"}
    </a>
  )
}
