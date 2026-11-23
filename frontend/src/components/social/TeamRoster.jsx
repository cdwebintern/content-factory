import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { tile } from "@/lib/glass"
import { cn } from "@/lib/utils"
import { getInitials } from "@/data/team"

const statusConfig = {
  online: { label: "Online", dot: "bg-emerald-500" },
  meeting: { label: "In a meeting", dot: "bg-red-500" },
  away: { label: "Away", dot: "bg-slate-400" },
}

export default function TeamRoster({ members, currentUserId }) {
  return (
    <ul className="space-y-2">
      {members.map((m) => {
        const s = statusConfig[m.status] ?? statusConfig.away
        return (
          <li key={m.id} className={cn(tile, "flex items-center gap-3 p-3")}>
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback className="bg-neutral-900 text-sm text-lime-accent">
                  {getInitials(m.name)}
                </AvatarFallback>
              </Avatar>
              {/* Status dot on the avatar's corner */}
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${s.dot}`}
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight text-neutral-900">
                {m.name}
                {m.id === currentUserId && (
                  <span className="ml-1.5 text-xs font-normal text-neutral-500">(You)</span>
                )}
              </p>
              <p className="text-xs text-neutral-500">{m.role}</p>
            </div>

            <span className="shrink-0 text-xs text-neutral-500">{s.label}</span>
          </li>
        )
      })}
    </ul>
  )
}