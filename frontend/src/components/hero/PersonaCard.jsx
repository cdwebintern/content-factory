import { useState } from "react"
import { getInitials } from "@/data/team"


export default function PersonaCard({ user, cutoutSrc = "/bilal-cutout.png" }) {
  const [cutoutOk, setCutoutOk] = useState(true)

  return (
    <div className="relative hidden min-h-75 overflow-hidden rounded-3xl bg-[#cfe9de] md:block">
      {/* Lime ribbon, decorative */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 200 300"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M-10 270 C 40 130, 150 300, 120 150 S 20 70, 90 45 S 210 80, 215 20"
          stroke="#e9ff6f"
          strokeWidth="26"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 p-4">
        <p className="text-base font-semibold text-neutral-900">{user.name}</p>
      </div>

      {/* Cutout photo or initials fallback */}
      <div className="absolute inset-x-0 bottom-0 top-12 flex items-end justify-center">
        {cutoutOk ? (
          <img
            src={cutoutSrc}
            alt=""
            onError={() => setCutoutOk(false)}
            className="max-h-full object-contain object-bottom drop-shadow-xl"
          />
        ) : (
          <div className="mb-20 grid h-32 w-32 place-items-center rounded-full bg-neutral-900 text-4xl font-semibold text-lime-accent shadow-xl ring-4 ring-white/60">
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {/* Persona tagline */}
      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/80 bg-white/65 px-3 py-2 text-center text-xs font-medium text-neutral-900 backdrop-blur-md">
        {user.role}
      </div>
    </div>
  )
}