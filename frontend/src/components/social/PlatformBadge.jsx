import { cn } from "@/lib/utils"

const platforms = {
  instagram: {
    label: "Instagram",
    className: "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 text-white",
  },
  linkedin: { label: "LinkedIn", className: "bg-[#0a66c2] text-white" },
  youtube: { label: "YouTube", className: "bg-red-600 text-white" },
  x: { label: "X", className: "bg-black text-white" },
}

export default function PlatformBadge({ platform, format }) {
  const p = platforms[platform] ?? { label: platform, className: "bg-slate-600 text-white" }

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", p.className)}>
        {p.label}
      </span>
      {format && <span className="text-xs text-muted-foreground">{format}</span>}
    </span>
  )
}