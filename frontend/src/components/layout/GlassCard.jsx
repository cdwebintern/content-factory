import { glass } from "@/lib/glass"
import { cn } from "@/lib/utils"

// Each tone is a soft tint over the glass, so cards are easy to tell apart
// but still belong to the same warm palette as the page background.
// Keys are intensity names, values come from the tokens in index.css.
const TONES = {
  neutral: { card: "", chip: "bg-ink text-accent-mist" },
  soft: { card: "from-accent-soft/80 via-white/55 to-white/45", chip: "bg-ink text-accent-mist" },
  warm: { card: "from-accent-soft/75 via-white/55 to-white/45", chip: "bg-accent-honey text-white" },
  tint: { card: "from-accent-tint/55 via-white/55 to-white/45", chip: "bg-accent-strong text-white" },
  deep: { card: "from-accent-mist/60 via-white/55 to-white/45", chip: "bg-accent-strong text-white" },
}

// "@container" lets everything inside size itself by the card's width (@lg:, @3xl:...)
export default function GlassCard({
  title,
  description,
  icon: Icon,
  action,
  tone = "neutral",
  className,
  children,
}) {
  const t = TONES[tone] ?? TONES.neutral

  return (
    <section
      className={cn(
        glass,
        "@container flex min-w-0 flex-col bg-linear-to-br p-4 sm:p-5 md:p-6",
        t.card,
        className
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", t.chip)}>
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                                  <h2 className="text-lg font-semibold leading-tight tracking-tight text-ink">
                  {title}
                </h2>
              )}
              {description && <div className="text-sm text-ink-muted">{description}</div>}
            </div>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}