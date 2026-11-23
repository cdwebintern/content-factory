// Fixed, decorative page background: pastel washes + slowly drifting colour blobs.
// Reuses the drift animations already in index.css.
const wash = [
  "radial-gradient(60% 50% at 8% 6%, #dce5ee 0%, transparent 70%)",
  "radial-gradient(40% 45% at 58% 0%, #cde8ea 0%, transparent 70%)",
  "radial-gradient(35% 40% at 100% 12%, #f8e2c6 0%, transparent 70%)",
  "radial-gradient(40% 45% at 100% 62%, #e3f5a5 0%, transparent 70%)",
  "radial-gradient(45% 45% at 70% 100%, #e6d6f5 0%, transparent 70%)",
  "radial-gradient(40% 40% at 8% 100%, #c8e8de 0%, transparent 70%)",
].join(",")

export default function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#eef2f5]"
    >
      <div className="absolute inset-0" style={{ backgroundImage: wash }} />

      <div className="animate-drift-b absolute left-[25%] top-[-6%] h-[28rem] w-[28rem] rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="animate-drift-a absolute right-[-6%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-orange-200/50 blur-3xl" />
      <div className="animate-drift-c absolute right-[-8%] top-[48%] h-[26rem] w-[26rem] rounded-full bg-lime-accent/50 blur-3xl" />
      <div className="animate-drift-a absolute bottom-[-12%] left-[40%] h-[30rem] w-[30rem] rounded-full bg-purple-200/50 blur-3xl" />
      <div className="animate-drift-b absolute bottom-[-10%] left-[-6%] h-[26rem] w-[26rem] rounded-full bg-emerald-100/70 blur-3xl" />
    </div>
  )
}