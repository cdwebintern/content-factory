import { useState } from "react"
import { getInitials } from "@/data/team"


export default function PersonaCard({ user, cutoutSrc = "/bilal-cutout.png" }) {
  const [cutoutOk, setCutoutOk] = useState(true)

  return (
    <div className="relative hidden min-h-75 overflow-visible rounded-3xl  md:block ">
      {/* Accent ribbon, decorative */}
      {/* <svg
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
      </svg> */}

      {/* <div className="relative z-10 p-4">
        <p className="text-base font-semibold text-ink">{user.name}</p>
      </div> */}

      {/* Cutout photo or initials fallback */}
      <div className="absolute inset-x-0 bottom-0 -top-8 z-10 flex items-end justify-center">
        {cutoutOk ? (
          <img
            src={cutoutSrc}
            alt=""
            onError={() => setCutoutOk(false)}
            className="block max-h-full object-contain object-bottom drop-shadow-xl"
          />
        ) : (
          <div className="mb-20 grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-accent-strong to-accent-honey text-4xl font-semibold text-white shadow-xl shadow-accent-ink/25 ring-4 ring-white/60">
            {getInitials(user.name)}
          </div>
        )}
      </div>

      {/* Persona tagline */}
      <div className="absolute inset-x-3 bottom-0 z-20 rounded-2xl border border-white/80 bg-white/75 p-3 text-center backdrop-blur-md shadow-lg">
        <p className="text-sm font-semibold text-ink">{user.name}</p>
        <p className="text-xs text-accent-burnt/70">{user.role}</p>
      </div>
    </div>
  )
}