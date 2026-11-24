import { cn } from "@/lib/utils"

function Block({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[1.75rem] border border-white/70 bg-white/50 motion-reduce:animate-none",
        className
      )}
    />
  )
}

export default function DashboardSkeleton({ variant = "home" }) {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading</span>

      {variant === "home" ? (
        <>
          <Block className="h-[420px] sm:h-[360px]" />
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Block className="h-[420px]" />
              <Block className="h-[360px]" />
            </div>
            <Block className="h-[520px]" />
          </div>
          <Block className="h-56" />
        </>
      ) : (
        <>
          <Block className="h-24 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Block key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Block className="h-[480px]" />
        </>
      )}
    </div>
  )
}