import { cn } from "@/lib/utils"
import { glass } from "@/lib/glass"

// Replaces shadcn <Card> for every section
export default function GlassCard({ title, description, className, children }) {
  return (
    <section className={cn(glass, "flex flex-col p-5 md:p-6", className)}>
      {(title || description) && (
        <header className="mb-4 space-y-0.5">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h2>
          )}
          {description && <div className="text-sm text-neutral-500">{description}</div>}
        </header>
      )}
      {children}
    </section>
  )
}