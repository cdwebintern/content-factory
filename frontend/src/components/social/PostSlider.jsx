import { Check, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useAutoCycle } from "@/hooks/useAutoCycle"
import { dueLabel, formatTime } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/glass"
import PlatformBadge from "./PlatformBadge"

const arrowBtn =
  "grid h-8 w-8 place-items-center rounded-full border border-glass-line bg-glass/70 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-tint hover:bg-accent-wash hover:text-accent-ink"

export default function PostSlider({ posts, onApprove }) {
  const { index, setIndex, paused, setPaused } = useAutoCycle(posts.length, 7000)

  if (posts.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-faint">No posts scheduled yet.</p>
    )
  }

  const post = posts[index]
  const approvedCount = posts.filter((p) => p.approved).length

  const prev = () => setIndex((i) => (i - 1 + posts.length) % posts.length)
  const next = () => setIndex((i) => (i + 1) % posts.length)

  return (
    <div
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="space-y-4"
    >
      {/* key={post.id} remounts the slide so it fades in on every change */}
      <div
        key={post.id}
        className="flex min-h-67.5 animate-in flex-col gap-4 rounded-2xl border border-glass-line bg-linear-to-br from-accent-mist/50 via-glass/70 to-glass/60 p-5 duration-500 fade-in"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PlatformBadge platform={post.platform} format={post.format} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint">
            <Clock className="h-3.5 w-3.5" />
            {dueLabel(post.scheduledAt).text}, {formatTime(post.scheduledAt)}
          </span>
        </div>

        <div>
          <p className="text-xs text-ink-faint">Client</p>
          <p className="text-base font-semibold text-ink">{post.client}</p>
        </div>

        <blockquote className="flex-1 rounded-xl border-l-4 border-accent bg-glass/80 p-3 text-sm leading-relaxed text-ink-deep">
          “{post.hook}”
        </blockquote>

        {post.approved ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-accent-mist px-4 py-2.5 text-sm font-semibold text-accent-ink">
            <Check className="h-4 w-4" />
            Approved
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => onApprove(post.id, e)}
            className={cn(
              "hover-lift w-full rounded-full bg-accent-strong px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-shade/20 hover:bg-accent hover:shadow-md",
              focusRing
            )}
          >
            Approve Post
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {posts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Go to post ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                focusRing,
                i === index
                  ? cn("w-6", p.approved ? "bg-emerald-500" : "bg-accent-strong")
                  : cn("w-2", p.approved ? "bg-emerald-300" : "bg-accent-ink/20 hover:bg-accent-ink/40")
              )}
            />
          ))}
          <span className="ml-2 text-xs text-ink-faint">
            {paused ? "Paused · " : ""}
            {approvedCount} of {posts.length} approved
          </span>
        </div>

        <div className="flex gap-1">
          <button type="button" onClick={prev} aria-label="Previous post" className={cn(arrowBtn, focusRing)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={next} aria-label="Next post" className={cn(arrowBtn, focusRing)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}