import { ChevronLeft, ChevronRight, Lightbulb, Sparkles } from "lucide-react"
import GlassCard from "@/components/layout/GlassCard"
import { useAutoCycle } from "@/hooks/useAutoCycle"
import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/glass"
import StatsStrip from "./StatsStrip"

const categoryStyles = {
  "SEO / AEO": "bg-sky-100 text-sky-800",
  "Meta Ads": "bg-blue-100 text-blue-800",
  "Winning Ad": "bg-lime-accent text-neutral-900",
  "Local SEO": "bg-emerald-100 text-emerald-800",
  Content: "bg-orange-100 text-orange-800",
}

const arrowBtn =
  "grid h-8 w-8 place-items-center rounded-full border border-white/80 bg-white/70 text-neutral-900 transition-colors hover:bg-white"

export default function NewsPulse({ items, pending, meetingsToday, overdue }) {
  const { index, setIndex, paused, setPaused } = useAutoCycle(items.length, 6000)

  if (items.length === 0) return null
  const item = items[index]

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length)
  const next = () => setIndex((i) => (i + 1) % items.length)

  return (
    <GlassCard  tone="peach" className="space-y-5">
      {/* Header: title on the left, live stats pill on the right */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-900 text-lime-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-neutral-900">
              Daily news &amp; winning ads
            </h2>
            <p className="text-xs text-neutral-500">
              What's moving in marketing today, and what we should do about it
            </p>
          </div>
        </div>

        <StatsStrip pending={pending} meetingsToday={meetingsToday} overdue={overdue} />
      </div>

      {/* Slide area: hovering or focusing pauses the auto-cycle */}
      <div
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="space-y-4"
      >
        {/* key={item.id} remounts the slide on change so it can fade in */}
        <div
          key={item.id}
          className="grid animate-in gap-5 fade-in duration-500 md:min-h-37.5 md:grid-cols-5"
        >
          <div className="space-y-3 md:col-span-3">
            <span
              className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                categoryStyles[item.category] ?? "bg-black/5 text-neutral-700"
              )}
            >
              {item.category}
            </span>
            <h3 className="text-2xl font-normal leading-snug tracking-tight text-neutral-900 md:text-3xl">
              {item.headline}
            </h3>
            <p className="text-sm text-neutral-500">
              {item.source} · {item.readTime}
            </p>
          </div>

          <div className="rounded-2xl bg-lime-accent/50 p-4 md:col-span-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <Lightbulb className="h-4 w-4" />
              Actionable takeaway
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-800">{item.takeaway}</p>
          </div>
        </div>

        {/* Controls: dots on the left, arrows on the right */}
        <div  className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  focusRing,
                  i === index ? "w-6 bg-neutral-900" : "w-2 bg-black/15 hover:bg-black/30"
                )}
              />
            ))}
            {paused && <span className="ml-2 text-xs text-neutral-500">Paused</span>}
          </div>

          <div className="flex gap-1">
            <button type="button" onClick={prev} aria-label="Previous slide" className={cn(arrowBtn, focusRing)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={next} aria-label="Next slide" className={cn(arrowBtn, focusRing)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}