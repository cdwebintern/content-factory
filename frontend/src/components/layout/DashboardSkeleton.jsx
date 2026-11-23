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

export default function DashboardSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading dashboard</span>

      {/* Hero */}
      <Block className="h-[360px]" />
      {/* Three columns */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Block className="h-[520px]" />
        <Block className="h-[520px]" />
        <Block className="h-[520px] md:col-span-2 xl:col-span-1" />
      </div>
      {/* News pulse */}
      <Block className="h-56" />
    </div>
  )
}