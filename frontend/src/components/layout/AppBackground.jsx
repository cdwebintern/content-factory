// Fixed, decorative page background: warm orange washes + slowly drifting colour blobs.
// Reuses the drift animations already in index.css.
// Colors come from the palette tokens in index.css
const wash = [
  "radial-gradient(60% 50% at 8% 6%, var(--color-accent-soft) 0%, transparent 70%)",
  "radial-gradient(40% 45% at 58% 0%, var(--color-accent-mist) 0%, transparent 70%)",
  "radial-gradient(35% 40% at 100% 12%, var(--color-accent-tint) 0%, transparent 70%)",
  // Green is the secondary hue: a little calm green on the left and at the bottom corner
  "radial-gradient(38% 42% at 0% 46%, var(--color-green-soft) 0%, transparent 70%)",
  "radial-gradient(40% 45% at 100% 62%, var(--color-accent-soft) 0%, transparent 70%)",
  "radial-gradient(45% 45% at 70% 100%, var(--color-accent-mist) 0%, transparent 70%)",
  "radial-gradient(40% 40% at 8% 100%, var(--color-accent-soft) 0%, transparent 70%)",
  "radial-gradient(32% 38% at 96% 96%, var(--color-green-soft) 0%, transparent 70%)",
].join(",")

export default function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface"
    >
      {/* In dark mode the washes are dark brown, so they are dimmed to keep the glass readable */}
      <div
        className="absolute inset-0 transition-opacity duration-500 dark:opacity-50"
        style={{ backgroundImage: wash }}
      />

      <div className="absolute inset-0 transition-opacity duration-500 dark:opacity-40">
        <div className="animate-drift-b absolute left-[25%] top-[-6%] h-[28rem] w-[28rem] rounded-full bg-accent-mist/50 blur-3xl" />
        <div className="animate-drift-a absolute right-[-6%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-accent-tint/45 blur-3xl" />
        <div className="animate-drift-c absolute right-[-8%] top-[48%] h-[26rem] w-[26rem] rounded-full bg-accent-mist/50 blur-3xl" />
        <div className="animate-drift-a absolute bottom-[-12%] left-[40%] h-[30rem] w-[30rem] rounded-full bg-accent-mist/40 blur-3xl" />
        <div className="animate-drift-b absolute bottom-[-10%] left-[-6%] h-[26rem] w-[26rem] rounded-full bg-accent-mist/50 blur-3xl" />
        <div className="animate-drift-c absolute left-[-4%] top-[34%] h-[24rem] w-[24rem] rounded-full bg-green-tint/35 blur-3xl" />
        <div className="animate-drift-b absolute bottom-[2%] right-[6%] h-[26rem] w-[26rem] rounded-full bg-green-tint/30 blur-3xl" />
      </div>
    </div>
  )
}
