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
        "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        large ? "w-full px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
        className
      )}
    >
      <Video className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {large ? "Join Meeting" : "Join"}
    </a>
  )
}